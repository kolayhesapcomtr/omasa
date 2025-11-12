import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, OrderStatus } from '@prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'product-id' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-id' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 89.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Az şekerli' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'table-id' })
  @IsString()
  tableId: string;

  @ApiProperty({ enum: OrderType, example: OrderType.QR })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'Mehmet Yılmaz' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'Hızlı olsun lütfen' })
  @IsString()
  @IsOptional()
  customerNote?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
