'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/use-menu';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function CategoryProductsPage() {
  const { user } = useAuth();
  const params = useParams();
  const categoryId = params.id as string;
  const { data: products, isLoading } = useProducts(categoryId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      image: formData.image || undefined,
      categoryId,
    };

    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data },
        {
          onSuccess: () => {
            setFormData({ name: '', description: '', price: '', image: '' });
            setEditingProduct(null);
            setShowProductForm(false);
          },
        },
      );
    } else {
      createProduct.mutate(data, {
        onSuccess: () => {
          setFormData({ name: '', description: '', price: '', image: '' });
          setShowProductForm(false);
        },
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image || '',
    });
    setShowProductForm(true);
  };

  const handleToggleAvailability = (product: any) => {
    updateProduct.mutate({
      id: product.id,
      data: { isAvailable: !product.isAvailable },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-sm text-gray-600">{user.tenant.name}</p>
          </div>
          <Link
            href="/admin/menu"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            ← Menüye Dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ürünler</h2>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', description: '', price: '', image: '' });
              setShowProductForm(!showProductForm);
            }}
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            + Yeni Ürün
          </button>
        </div>

        {/* Product Form */}
        {showProductForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">
              {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ürün Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="Margherita Pizza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Domates, mozzarella, fesleğen..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fiyat (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="89.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Görsel URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {createProduct.isPending || updateProduct.isPending
                    ? 'Kaydediliyor...'
                    : editingProduct
                      ? 'Güncelle'
                      : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setFormData({ name: '', description: '', price: '', image: '' });
                  }}
                  className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="rounded-lg bg-white shadow">
          {isLoading ? (
            <div className="p-8 text-center">Yükleniyor...</div>
          ) : products && products.length > 0 ? (
            <div className="divide-y">
              {products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          {product.description && (
                            <p className="mt-1 text-sm text-gray-600">{product.description}</p>
                          )}
                          <p className="mt-2 text-lg font-bold text-blue-600">
                            {formatCurrency(product.price)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                              product.isAvailable
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {product.isAvailable ? '✓ Mevcut' : '✗ Tükendi'}
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm('Bu ürünü silmek istediğinizden emin misiniz?')
                              ) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                            className="rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-200"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              Bu kategori için henüz ürün eklenmemiş
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
