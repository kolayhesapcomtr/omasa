import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
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
