import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ProductStock {
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

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

export interface StockAlert {
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
  createdAt: string;
}

export function useStock() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductStock[]>([]);
  const [movements, setMovements] = useState<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }>({ data: [], total: 0, page: 1, limit: 50 });
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductStocks = async (branchId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get(`/stock/products${params}`);
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch product stocks');
      console.error('Error fetching product stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async (branchId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get(`/stock/products/low-stock${params}`);
      setLowStockProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch low stock products');
      console.error('Error fetching low stock products:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProductStock = async (
    productId: string,
    data: {
      trackStock?: boolean;
      stockQuantity?: number;
      minStockLevel?: number;
      stockUnit?: string;
    },
  ) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.put(`/stock/product/${productId}`, data);
      // Refresh products after update
      await fetchProductStocks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product stock');
      console.error('Error updating product stock:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createStockMovement = async (data: {
    productId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'RETURN';
    quantity: number;
    reference?: string;
    notes?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/stock/movement', data);
      // Refresh products and movements after creating movement
      await Promise.all([fetchProductStocks(), fetchStockMovements()]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create stock movement');
      console.error('Error creating stock movement:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async (filters?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const response = await apiClient.get(`/stock/movements?${params.toString()}`);
      setMovements(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stock movements');
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockAlerts = async (includeResolved = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/stock/alerts?includeResolved=${includeResolved}`,
      );
      setAlerts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stock alerts');
      console.error('Error fetching stock alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await apiClient.patch(`/stock/alerts/${alertId}/read`);
      await fetchStockAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark alert as read');
      console.error('Error marking alert as read:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await apiClient.patch(`/stock/alerts/${alertId}/resolve`);
      await fetchStockAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve alert');
      console.error('Error resolving alert:', err);
    }
  };

  return {
    products,
    lowStockProducts,
    movements,
    alerts,
    loading,
    error,
    fetchProductStocks,
    fetchLowStockProducts,
    updateProductStock,
    createStockMovement,
    fetchStockMovements,
    fetchStockAlerts,
    markAlertAsRead,
    resolveAlert,
  };
}
