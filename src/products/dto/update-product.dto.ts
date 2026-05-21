import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsPositive, IsInt, Min, IsArray, IsUrl, ArrayMaxSize, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Wireless Headphones', description: 'Product title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'High quality sound...', description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 99.99, description: 'Product price' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 50, description: 'Stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: ['http://example.com/image.jpg'], description: 'Product images' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  images?: string[];

  @ApiPropertyOptional({ example: 'SKU-123', description: 'Stock Keeping Unit' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the product is published' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'cm3h2...', description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
