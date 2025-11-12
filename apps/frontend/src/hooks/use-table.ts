import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export enum TableStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

interface Table {
  id: string;
  number: string;
  name?: string;
  qrCode: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  area?: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  };
}

interface CreateTableData {
  number: string;
  name?: string;
  branchId: string;
  capacity?: number;
  area?: string;
}

interface UpdateTableData {
  number?: string;
  name?: string;
  capacity?: number;
  area?: string;
  status?: TableStatus;
  isActive?: boolean;
}

export function useTables(branchId?: string) {
  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: async () => {
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get<Table[]>(`/tables${params}`);
      return response.data;
    },
  });
}

export function useTable(id: string) {
  return useQuery({
    queryKey: ['tables', id],
    queryFn: async () => {
      const response = await apiClient.get<Table>(`/tables/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useTablesByArea(branchId: string) {
  return useQuery({
    queryKey: ['tables', 'by-area', branchId],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, Table[]>>(
        `/tables/by-area/${branchId}`,
      );
      return response.data;
    },
    enabled: !!branchId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTableData) => {
      const response = await apiClient.post<Table>('/tables', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Masa başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Masa oluşturulamadı');
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTableData }) => {
      const response = await apiClient.put<Table>(`/tables/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Masa başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Masa güncellenemedi');
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Masa başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Masa silinemedi');
    },
  });
}

export function useRegenerateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<Table>(`/tables/${id}/regenerate-qr`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('QR kod yenilendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'QR kod yenilenemedi');
    },
  });
}
