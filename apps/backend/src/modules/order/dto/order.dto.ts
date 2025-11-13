import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, IsEmail, IsDateString } from 'class-validator';
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
  @ApiPropertyOptional({ example: 'table-id', description: 'Required for dine-in orders, optional for takeaway/delivery' })
  @IsString()
  @IsOptional()
  tableId?: string;

  @ApiProperty({ enum: OrderType, example: OrderType.QR })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // Customer info (required for takeaway/delivery)
  @ApiPropertyOptional({ example: 'Mehmet Yılmaz' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Hızlı olsun lütfen' })
  @IsString()
  @IsOptional()
  customerNote?: string;

  // Delivery info (for DELIVERY type)
  @ApiPropertyOptional({ example: 'Atatürk Cad. No:123 Daire:4' })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @ApiPropertyOptional({ example: 'Kadıköy' })
  @IsString()
  @IsOptional()
  deliveryDistrict?: string;

  @ApiPropertyOptional({ example: '34710' })
  @IsString()
  @IsOptional()
  deliveryZipCode?: string;

  @ApiPropertyOptional({ example: 'Kapı kodu: 1234' })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  // Scheduling
  @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z', description: 'Scheduled time for the order' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @ApiPropertyOptional({ example: 30, description: 'Estimated preparation time in minutes' })
  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @ApiPropertyOptional({ example: 15.00, description: 'Delivery fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @ApiProperty({ example: 'branch-id' })
  @IsString()
  branchId: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
