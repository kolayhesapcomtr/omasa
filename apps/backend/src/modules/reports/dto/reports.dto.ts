import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export class ReportsQueryDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export interface SalesOverviewDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalTips: number;
  completedOrders: number;
  cancelledOrders: number;
  paymentMethods: {
    method: string;
    count: number;
    total: number;
  }[];
}

export interface ProductSalesDto {
  productId: string;
  productName: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  timesOrdered: number;
}

export interface WaiterPerformanceDto {
  waiterId: string;
  waiterName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTips: number;
}

export interface DailySalesDto {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface CategorySalesDto {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  revenue: number;
  percentage: number;
}

export interface RevenueByHourDto {
  hour: number;
  revenue: number;
  orders: number;
}
