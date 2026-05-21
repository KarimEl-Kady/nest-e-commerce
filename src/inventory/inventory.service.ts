import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Count active reservations that haven't expired
    const activeReservationsAgg = await this.prisma.stockReservation.aggregate({
      where: {
        productId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      _sum: {
        quantity: true
      }
    });

    const activeReservations = activeReservationsAgg._sum.quantity || 0;
    const availableStock = product.stock - activeReservations;

    return {
      productId,
      physicalStock: product.stock,
      activeReservations,
      availableStock
    };
  }

  async reserveStock(createReservationDto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the product row
      const productRaw = await tx.$queryRaw<any[]>`SELECT * FROM products WHERE id = ${createReservationDto.productId} FOR UPDATE`;
      
      if (!productRaw || productRaw.length === 0) {
        throw new NotFoundException('Product not found');
      }
      
      const product = productRaw[0];

      // 2. Calculate active reservations
      const activeReservationsAgg = await tx.stockReservation.aggregate({
        where: {
          productId: createReservationDto.productId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        },
        _sum: { quantity: true }
      });
      
      const activeReservations = activeReservationsAgg._sum.quantity || 0;
      const availableStock = product.stock - activeReservations;

      if (createReservationDto.quantity > availableStock) {
        throw new ConflictException('Insufficient available stock');
      }

      // 3. Create reservation (expires in 15 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const reservation = await tx.stockReservation.create({
        data: {
          productId: createReservationDto.productId,
          userId,
          quantity: createReservationDto.quantity,
          status: 'ACTIVE',
          expiresAt
        }
      });

      return reservation;
    });
  }

  async commitReservation(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id }
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      // Lock product row to prevent concurrent modifications during commit
      await tx.$queryRaw<any[]>`SELECT * FROM products WHERE id = ${reservation.productId} FOR UPDATE`;
      
      if (reservation.status !== 'ACTIVE' || reservation.expiresAt <= new Date()) {
        throw new ConflictException('Reservation is expired or already committed');
      }

      await tx.stockReservation.update({
        where: { id },
        data: { status: 'COMMITTED' }
      });

      await tx.product.update({
        where: { id: reservation.productId },
        data: { stock: { decrement: reservation.quantity } }
      });

      await tx.inventoryLedger.create({
        data: {
          productId: reservation.productId,
          quantityChange: -reservation.quantity,
          reason: 'ORDER_COMPLETED',
          adminId: null
        }
      });

      return { message: 'Reservation committed successfully' };
    });
  }

  async adjustStock(createAdjustmentDto: any, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the product row
      const productRaw = await tx.$queryRaw<any[]>`SELECT * FROM products WHERE id = ${createAdjustmentDto.productId} FOR UPDATE`;
      
      if (!productRaw || productRaw.length === 0) {
        throw new NotFoundException('Product not found');
      }
      
      const product = productRaw[0];

      // 2. Prevent negative adjustments that exceed physical stock
      // (Using standard exceptions - BadRequestException needs to be imported)
      if (createAdjustmentDto.quantityChange < 0 && Math.abs(createAdjustmentDto.quantityChange) > product.stock) {
        throw new ConflictException('Negative adjustment exceeds physical stock');
      }

      // 3. Update physical stock
      await tx.product.update({
        where: { id: createAdjustmentDto.productId },
        data: { stock: { increment: createAdjustmentDto.quantityChange } }
      });

      // 4. Create audit ledger entry
      const ledgerEntry = await tx.inventoryLedger.create({
        data: {
          productId: createAdjustmentDto.productId,
          quantityChange: createAdjustmentDto.quantityChange,
          reason: createAdjustmentDto.reason,
          adminId
        }
      });

      return ledgerEntry;
    });
  }
}

// Triggering recompile to pick up generated Prisma client

