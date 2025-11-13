import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, IsArray, ArrayMinSize } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'table-id' })
  @IsString()
  tableId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tipAmount?: number;

  @ApiPropertyOptional({ example: 'Müşteri notu' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class PaymentResponseDto {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date;
  invoice?: InvoiceDto;
}

export class InvoiceDto {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  createdAt: Date;
}

// ============================================
// BILL MERGE & SPLIT DTOs
// ============================================

export class MergeTablesDto {
  @ApiProperty({ description: 'Source table IDs to merge from', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sourceTableIds: string[];

  @ApiProperty({ description: 'Target table ID to merge into' })
  @IsString()
  targetTableId: string;
}

export class SplitBillDto {
  @ApiProperty({ description: 'Table ID to split bill' })
  @IsString()
  tableId: string;

  @ApiProperty({ description: 'Number of ways to split (2 = half, 3 = thirds, etc.)' })
  @IsNumber()
  @Min(2)
  splitCount: number;

  @ApiPropertyOptional({ description: 'Custom split percentages (must add up to 100)', type: [Number] })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  customPercentages?: number[];
}

export class SplitByItemsDto {
  @ApiProperty({ description: 'Table ID' })
  @IsString()
  tableId: string;

  @ApiProperty({ description: 'Order item IDs to move to new bill', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderItemIds: string[];

  @ApiPropertyOptional({ description: 'New table ID for split items (optional)' })
  @IsString()
  @IsOptional()
  newTableId?: string;
}

export class TransferOrderDto {
  @ApiProperty({ description: 'Order ID to transfer' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Target table ID' })
  @IsString()
  targetTableId: string;
}
