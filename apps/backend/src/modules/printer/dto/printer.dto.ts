import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';
import { PrinterType, PrinterConnection, PrintJobType } from '@prisma/client';

// Create/Update Printer
export class CreatePrinterDto {
  @IsString()
  name: string;

  @IsEnum(PrinterType)
  type: PrinterType;

  @IsEnum(PrinterConnection)
  connection: PrinterConnection;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsString()
  @IsOptional()
  usbPath?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsNumber()
  @IsOptional()
  @Min(58)
  @Max(80)
  paperWidth?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  autoPrint?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  branchId: string;
}

export class UpdatePrinterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PrinterType)
  @IsOptional()
  type?: PrinterType;

  @IsEnum(PrinterConnection)
  @IsOptional()
  connection?: PrinterConnection;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsString()
  @IsOptional()
  usbPath?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsNumber()
  @IsOptional()
  @Min(58)
  @Max(80)
  paperWidth?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  autoPrint?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}

// Print Job
export class CreatePrintJobDto {
  @IsString()
  printerId: string;

  @IsEnum(PrintJobType)
  type: PrintJobType;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;

  @IsString()
  content: string;
}

// Manual print request
export class PrintOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  printerId?: string; // If not provided, auto-select based on order items
}

export class PrintBillDto {
  @IsString()
  tableId: string;

  @IsString()
  @IsOptional()
  printerId?: string;
}

export class PrintReceiptDto {
  @IsString()
  paymentId: string;

  @IsString()
  @IsOptional()
  printerId?: string;
}

// Test print
export class TestPrintDto {
  @IsString()
  printerId: string;
}

// Response DTOs
export class PrinterResponseDto {
  id: string;
  name: string;
  type: PrinterType;
  connection: PrinterConnection;
  ipAddress?: string;
  port?: number;
  paperWidth: number;
  isActive: boolean;
  autoPrint: boolean;
  categoryIds: string[];
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrintJobResponseDto {
  id: string;
  printerId: string;
  printerName: string;
  type: PrintJobType;
  status: string;
  orderId?: string;
  paymentId?: string;
  invoiceId?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  printedAt?: Date;
  createdAt: Date;
}
