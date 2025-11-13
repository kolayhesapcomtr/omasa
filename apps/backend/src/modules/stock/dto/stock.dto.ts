import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { StockMovementType } from '@prisma/client';

// Update product stock settings
export class UpdateProductStockDto {
  @IsBoolean()
  @IsOptional()
  trackStock?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStockLevel?: number;

  @IsString()
  @IsOptional()
  stockUnit?: string; // "adet", "kg", "litre", "porsiyon"
}

// Create stock movement
export class CreateStockMovementDto {
  @IsString()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reference?: string; // Invoice no, receipt no, etc.

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}

// Response DTOs
export class StockMovementResponseDto {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

export class StockAlertResponseDto {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  alertType: string;
  message: string;
  currentStock: number;
  minStockLevel: number;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
}

export class ProductStockStatusDto {
  id: string;
  name: string;
  image?: string;
  trackStock: boolean;
  stockQuantity: number;
  minStockLevel: number;
  stockUnit?: string;
  isAvailable: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  categoryName: string;
}

// Query filters
export class StockMovementFilterDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(StockMovementType)
  @IsOptional()
  type?: StockMovementType;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 50;
}
