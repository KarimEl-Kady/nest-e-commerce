import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ReservationCleanupCron } from './cron/reservation-cleanup.cron';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, ReservationCleanupCron],
  exports: [InventoryService]
})
export class InventoryModule {}
