import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantName: string;
  tenantSlug: string;
  tenantEmail: string;
  tenantPhone?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      const response = await apiClient.get('/auth/me');
      return response.data;
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      queryClient.setQueryData(['auth', 'me'], data.user);
      toast.success('Giriş başarılı!');
      router.push('/admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Giriş başarısız');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      queryClient.setQueryData(['auth', 'me'], data.user);
      toast.success('Kayıt başarılı! Hoş geldiniz!');
      router.push('/admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kayıt başarısız');
    },
  });

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    queryClient.setQueryData(['auth', 'me'], null);
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}
