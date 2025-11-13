import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface CreatePaymentData {
  tableId: string;
  method: 'CASH' | 'CREDIT_CARD' | 'ONLINE';
  tipAmount?: number;
  notes?: string;
}

export function useTableBill(tableId: string) {
  return useQuery({
    queryKey: ['payments', 'bill', tableId],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/table/${tableId}/bill`);
      return response.data;
    },
    enabled: !!tableId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const response = await apiClient.post('/payments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Ödeme başarıyla alındı! 💰');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ödeme alınamadı');
    },
  });
}

export function usePayments(branchId?: string) {
  return useQuery({
    queryKey: ['payments', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const response = await apiClient.get(`/payments?${params.toString()}`);
      return response.data;
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await apiClient.get('/payments/invoices');
      return response.data;
    },
  });
}
