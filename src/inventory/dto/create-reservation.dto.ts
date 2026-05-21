import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 'cm3h...', description: 'ID of the product to reserve' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity to reserve' })
  @IsInt()
  @Min(1)
  quantity: number;
}
