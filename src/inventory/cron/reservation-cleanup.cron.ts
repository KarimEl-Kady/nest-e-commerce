import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReservationCleanupCron {
  private readonly logger = new Logger(ReservationCleanupCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running expired reservation cleanup...');

    try {
      const result = await this.prisma.stockReservation.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: new Date() }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      if (result.count > 0) {
        this.logger.log(`Expired ${result.count} reservations.`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired reservations', error);
    }
  }
}
