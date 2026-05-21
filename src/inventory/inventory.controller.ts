import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('availability/:productId')
  @Public()
  @ApiOperation({ summary: 'Get available stock for a product' })
  @ApiResponse({ status: 200, description: 'Stock availability retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getAvailability(@Param('productId') productId: string) {
    return this.inventoryService.getAvailability(productId);
  }

  @Post('reservations')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a temporary stock reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Insufficient available stock' })
  reserveStock(@Body() createReservationDto: CreateReservationDto, @CurrentUser() user: any) {
    return this.inventoryService.reserveStock(createReservationDto, user?.sub);
  }

  @Post('reservations/:id/commit')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Commit a stock reservation' })
  @ApiResponse({ status: 200, description: 'Reservation committed successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Reservation is expired or already committed' })
  commitReservation(@Param('id') id: string) {
    return this.inventoryService.commitReservation(id);
  }

  @Post('adjustments')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a manual stock adjustment' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Negative adjustment exceeds available stock' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  adjustStock(@Body() createAdjustmentDto: CreateAdjustmentDto, @CurrentUser() user: any) {
    return this.inventoryService.adjustStock(createAdjustmentDto, user.sub);
  }
}
