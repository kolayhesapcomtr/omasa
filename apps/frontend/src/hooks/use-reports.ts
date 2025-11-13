import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type ReportPeriod = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface ReportsQuery {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface SalesOverview {
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

export interface ProductSales {
  productId: string;
  productName: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  timesOrdered: number;
}

export interface WaiterPerformance {
  waiterId: string;
  waiterName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTips: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  revenue: number;
  percentage: number;
}

export interface RevenueByHour {
  hour: number;
  revenue: number;
  orders: number;
}

function buildQueryParams(query?: ReportsQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.period) params.append('period', query.period);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.branchId) params.append('branchId', query.branchId);
  return params.toString();
}

export function useSalesOverview(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'sales-overview', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<SalesOverview>(
        `/reports/sales-overview?${queryParams}`
      );
      return response.data;
    },
  });
}

export function useProductSales(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'product-sales', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<ProductSales[]>(
        `/reports/product-sales?${queryParams}`
      );
      return response.data;
    },
  });
}

export function useWaiterPerformance(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'waiter-performance', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<WaiterPerformance[]>(
        `/reports/waiter-performance?${queryParams}`
      );
      return response.data;
    },
  });
}

export function useDailySales(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'daily-sales', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<DailySales[]>(
        `/reports/daily-sales?${queryParams}`
      );
      return response.data;
    },
  });
}

export function useCategorySales(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'category-sales', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<CategorySales[]>(
        `/reports/category-sales?${queryParams}`
      );
      return response.data;
    },
  });
}

export function useRevenueByHour(query?: ReportsQuery) {
  const queryParams = buildQueryParams(query);

  return useQuery({
    queryKey: ['reports', 'revenue-by-hour', queryParams],
    queryFn: async () => {
      const response = await apiClient.get<RevenueByHour[]>(
        `/reports/revenue-by-hour?${queryParams}`
      );
      return response.data;
    },
  });
}
