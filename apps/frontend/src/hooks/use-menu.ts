import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface Menu {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  branchId: string;
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  menuId: string;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  isActive: boolean;
  isAvailable: boolean;
  order: number;
  allergens?: string[];
  tags?: string[];
  categoryId: string;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  order: number;
  productId: string;
}

// MENU HOOKS
export function useMenus(branchId?: string) {
  return useQuery({
    queryKey: ['menus', branchId],
    queryFn: async () => {
      const params = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get<Menu[]>(`/menu${params}`);
      return response.data;
    },
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ['menus', id],
    queryFn: async () => {
      const response = await apiClient.get<Menu>(`/menu/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; branchId: string }) => {
      const response = await apiClient.post<Menu>('/menu', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menü başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Menü oluşturulamadı');
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; isActive?: boolean };
    }) => {
      const response = await apiClient.put<Menu>(`/menu/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menü başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Menü güncellenemedi');
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menü başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Menü silinemedi');
    },
  });
}

// CATEGORY HOOKS
export function useCategories(menuId: string) {
  return useQuery({
    queryKey: ['categories', menuId],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>(`/menu/categories/menu/${menuId}`);
      return response.data;
    },
    enabled: !!menuId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      image?: string;
      menuId: string;
      order?: number;
    }) => {
      const response = await apiClient.post<Category>('/menu/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Kategori başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kategori oluşturulamadı');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        image?: string;
        order?: number;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put<Category>(`/menu/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Kategori başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kategori güncellenemedi');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Kategori başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kategori silinemedi');
    },
  });
}

// PRODUCT HOOKS
export function useProducts(categoryId: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>(`/menu/products/category/${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      image?: string;
      price: number;
      categoryId: string;
      allergens?: string[];
      tags?: string[];
      order?: number;
    }) => {
      const response = await apiClient.post<Product>('/menu/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Ürün başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün oluşturulamadı');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        image?: string;
        price?: number;
        allergens?: string[];
        tags?: string[];
        order?: number;
        isActive?: boolean;
        isAvailable?: boolean;
      };
    }) => {
      const response = await apiClient.put<Product>(`/menu/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Ürün başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün güncellenemedi');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Ürün başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün silinemedi');
    },
  });
}

// PRODUCT VARIANT HOOKS
export function useCreateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      productId: string;
      order?: number;
    }) => {
      const response = await apiClient.post<ProductVariant>('/menu/variants', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Varyant başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Varyant oluşturulamadı');
    },
  });
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu/variants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Varyant başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Varyant silinemedi');
    },
  });
}
