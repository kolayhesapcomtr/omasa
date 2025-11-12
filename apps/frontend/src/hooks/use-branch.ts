import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
}

interface CreateBranchData {
  name: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get<Branch[]>('/branches');
      return response.data;
    },
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: async () => {
      const response = await apiClient.get<Branch>(`/branches/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBranchData) => {
      const response = await apiClient.post<Branch>('/branches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Şube başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Şube oluşturulamadı');
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBranchData> }) => {
      const response = await apiClient.put<Branch>(`/branches/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Şube başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Şube güncellenemedi');
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Şube başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Şube silinemedi');
    },
  });
}
