import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN';
  phone?: string;
}

interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'OWNER' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN';
  phone?: string;
  isActive?: boolean;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await apiClient.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı başarıyla oluşturuldu! 👤');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kullanıcı oluşturulamadı');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await apiClient.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kullanıcı güncellenemedi');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kullanıcı silinemedi');
    },
  });
}
