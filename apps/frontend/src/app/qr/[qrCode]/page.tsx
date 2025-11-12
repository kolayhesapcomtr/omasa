'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  isAvailable: boolean;
  allergens?: string[];
  tags?: string[];
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  products: Product[];
}

interface Menu {
  id: string;
  name: string;
  categories: Category[];
}

export default function QRMenuPage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);

  const { items, addItem, removeItem, updateQuantity, getTotal, getItemCount, setTable } =
    useCartStore();

  // Get table info by QR code
  const { data: table, isLoading: tableLoading } = useQuery({
    queryKey: ['table', qrCode],
    queryFn: async () => {
      const response = await apiClient.get(`/tables/qr/${qrCode}`);
      return response.data;
    },
  });

  // Get menu for branch
  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ['menus', table?.branch?.id],
    queryFn: async () => {
      if (!table?.branch?.id) return [];
      const response = await apiClient.get(`/menu?branchId=${table.branch.id}`);
      return response.data as Menu[];
    },
    enabled: !!table?.branch?.id,
  });

  // Set table info when loaded
  useEffect(() => {
    if (table) {
      setTable(table.id, qrCode);
    }
  }, [table, qrCode, setTable]);

  // Auto-select first category
  useEffect(() => {
    if (menus && menus.length > 0 && menus[0].categories.length > 0 && !selectedCategory) {
      setSelectedCategory(menus[0].categories[0].id);
    }
  }, [menus, selectedCategory]);

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      price: variant ? variant.price : product.price,
      variantId: variant?.id,
      variantName: variant?.name,
    });
    toast.success(`${product.name} sepete eklendi`);
    setSelectedProduct(null);
  };

  if (tableLoading || menusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-4xl">🍽️</div>
          <p className="text-lg text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!table || !menus || menus.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Menü Bulunamadı</h1>
          <p className="text-gray-600">Bu masa için menü tanımlanmamış.</p>
        </div>
      </div>
    );
  }

  const currentMenu = menus[0];
  const selectedCategoryData = currentMenu.categories.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{table.branch.tenant.name}</h1>
              <p className="text-sm text-gray-600">
                {table.branch.name} · Masa {table.number}
                {table.name && ` (${table.name})`}
              </p>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative rounded-full bg-blue-600 p-3 text-white hover:bg-blue-700"
            >
              🛒
              {getItemCount() > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[88px] z-10 border-b bg-white">
        <div className="mx-auto max-w-4xl overflow-x-auto">
          <div className="flex gap-2 px-4 py-3">
            {currentMenu.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {selectedCategoryData && (
          <>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{selectedCategoryData.name}</h2>
            <div className="space-y-4">
              {selectedCategoryData.products
                .filter((p) => p.isAvailable)
                .map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full rounded-lg border bg-white p-4 text-left transition hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
                        <h3 className="mb-1 font-semibold text-gray-900">{product.name}</h3>
                        {product.description && (
                          <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(product.price)}
                          </span>
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex gap-1">
                              {product.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 sm:items-center">
          <div className="w-full max-w-2xl rounded-t-2xl bg-white sm:rounded-2xl">
            <div className="max-h-[90vh] overflow-y-auto p-6">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>

              {/* Product Image */}
              {selectedProduct.image && (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              )}

              <h2 className="mb-2 text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="mb-4 text-gray-600">{selectedProduct.description}</p>
              )}

              <p className="mb-4 text-2xl font-bold text-blue-600">
                {formatCurrency(selectedProduct.price)}
              </p>

              {/* Variants */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold">Boyut Seçin:</h3>
                  <div className="space-y-2">
                    {selectedProduct.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleAddToCart(selectedProduct, variant)}
                        className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 p-3 hover:border-blue-500"
                      >
                        <span className="font-semibold">{variant.name}</span>
                        <span className="text-blue-600">{formatCurrency(variant.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Sepete Ekle
                </button>
              )}

              {/* Allergens */}
              {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                  <p className="text-sm font-semibold text-yellow-800">Alerjen Uyarısı:</p>
                  <p className="text-sm text-yellow-700">
                    {selectedProduct.allergens.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 sm:items-center">
          <div className="w-full max-w-2xl rounded-t-2xl bg-white sm:rounded-2xl">
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 border-b bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Sepetim ({getItemCount()} ürün)</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-4">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-gray-600">Sepetiniz boş</div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3 rounded-lg border p-3">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {item.productName}
                            {item.variantName && ` (${item.variantName})`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                  item.variantId,
                                )
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                  item.variantId,
                                )
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="sticky bottom-0 border-t bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-semibold">Toplam:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      toast.info('Sipariş sistemi yakında aktif olacak!');
                    }}
                    className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    Siparişi Gönder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
