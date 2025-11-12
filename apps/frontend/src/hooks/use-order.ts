import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface CreateOrderData {
  tableId: string;
  type: 'QR' | 'WAITER' | 'TAKEAWAY';
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerNote?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const response = await apiClient.post('/orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Siparişiniz başarıyla alındı! 🎉');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Sipariş gönderilemedi');
    },
  });
}

export function useOrders(branchId?: string, status?: string) {
  return useQuery({
    queryKey: ['orders', branchId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (status) params.append('status', status);

      const response = await apiClient.get(`/orders?${params.toString()}`);
      return response.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.put(`/orders/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Sipariş durumu güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Durum güncellenemedi');
    },
  });
}

export function useActiveOrders(branchId?: string) {
  return useQuery({
    queryKey: ['orders', 'active', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const response = await apiClient.get(`/orders/active?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/table/${tableId}`);
      return response.data;
    },
    enabled: !!tableId,
  });
}

export function useKitchenOrders(branchId?: string) {
  return useQuery({
    queryKey: ['orders', 'kitchen', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const response = await apiClient.get(`/orders/kitchen?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for kitchen
  });
}
