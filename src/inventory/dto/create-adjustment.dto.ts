import { IsString, IsInt, NotEquals, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  @ApiProperty({ example: 'cm3h...', description: 'ID of the product' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 50, description: 'Positive to add stock, negative to remove stock' })
  @IsInt()
  @NotEquals(0)
  quantityChange: number;

  @ApiProperty({ example: 'RESTOCK', description: 'Reason for the adjustment' })
  @IsString()
  @MinLength(1)
  reason: string;
}
