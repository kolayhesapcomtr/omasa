'use client';

import { useState, useMemo } from 'react';
import { useCreateWaiterOrder } from '@/hooks/use-order';
import { useTables } from '@/hooks/use-table';
import { useBranches } from '@/hooks/use-branch';
import { useMenus } from '@/hooks/use-menu';

interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  notes?: string;
}

export default function WaiterPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [productNotes, setProductNotes] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { data: branches } = useBranches();
  const { data: tables } = useTables();
  const { data: menus } = useMenus(selectedBranch || undefined);
  const createOrder = useCreateWaiterOrder();

  // Get first menu and its categories
  const menu = menus?.[0];
  const categories = menu?.categories || [];

  // Filter tables by selected branch
  const filteredTables = useMemo(() => {
    if (!tables || !selectedBranch) return [];
    return tables.filter((table: any) => table.branchId === selectedBranch && table.isActive);
  }, [tables, selectedBranch]);

  // Get products for selected category
  const displayedProducts = useMemo(() => {
    if (!selectedCategory) return [];
    const category = categories.find((cat: any) => cat.id === selectedCategory);
    return category?.products?.filter((p: any) => p.isActive) || [];
  }, [categories, selectedCategory]);

  const addToCart = () => {
    if (!selectedProduct) return;

    const variant = selectedProduct.variants?.find((v: any) => v.id === selectedVariant);
    const price = variant ? parseFloat(variant.price) : parseFloat(selectedProduct.price);

    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === selectedProduct.id &&
        item.variantId === (variant?.id || '') &&
        item.notes === productNotes
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          variantId: variant?.id,
          variantName: variant?.name,
          quantity: 1,
          price,
          notes: productNotes,
        },
      ]);
    }

    setSelectedProduct(null);
    setSelectedVariant('');
    setProductNotes('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = () => {
    if (!selectedTable || cart.length === 0) return;

    const orderItems = cart.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.price,
      notes: item.notes,
    }));

    createOrder.mutate(
      {
        tableId: selectedTable,
        type: 'WAITER',
        items: orderItems,
      },
      {
        onSuccess: () => {
          setCart([]);
          setShowCart(false);
          setSelectedTable('');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👨‍💼 Sipariş Al</h1>
              <p className="text-sm text-gray-600">Masa için sipariş oluştur</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              disabled={cart.length === 0}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🛒 Sepet
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Branch and Table Selection */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şube</label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSelectedTable('');
                  setSelectedCategory('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Şube Seçin</option>
                {branches?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Masa</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={!selectedBranch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Masa Seçin</option>
                {filteredTables.map((table: any) => (
                  <option key={table.id} value={table.id}>
                    Masa {table.number} {table.name && `(${table.name})`} - {table.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedBranch ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Şube Seçin</h2>
            <p className="text-gray-600">Sipariş almak için önce bir şube seçin</p>
          </div>
        ) : !selectedTable ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🪑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Masa Seçin</h2>
            <p className="text-gray-600">Sipariş almak için bir masa seçin</p>
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            {categories.length > 0 && (
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {selectedCategory ? (
              displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedProducts.map((product: any) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    >
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        )}
                        <p className="text-lg font-bold text-blue-600">₺{product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500">Bu kategoride ürün bulunmuyor</p>
                </div>
              )
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Kategori Seçin</h2>
                <p className="text-gray-600">Ürünleri görmek için bir kategori seçin</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              {selectedProduct.description && <p className="text-gray-600 mb-4">{selectedProduct.description}</p>}

              {/* Variants */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Boyut</label>
                  <div className="space-y-2">
                    {selectedProduct.variants.filter((v: any) => v.isActive).map((variant: any) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-colors ${
                          selectedVariant === variant.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{variant.name}</span>
                          <span className="font-bold text-blue-600">₺{variant.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (opsiyonel)</label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="Örn: Az şekerli, soğuk olsun"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCart(false)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sepet</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Sepetiniz boş</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.productName}
                            {item.variantName && <span className="text-gray-600"> ({item.variantName})</span>}
                          </h3>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">Not: {item.notes}</p>}
                          <p className="text-sm font-medium text-blue-600 mt-1">₺{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="ml-2 text-red-600 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold text-gray-900">Toplam</span>
                      <span className="text-2xl font-bold text-gray-900">₺{getTotal().toFixed(2)}</span>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={createOrder.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg disabled:opacity-50"
                    >
                      {createOrder.isPending ? 'Gönderiliyor...' : 'Siparişi Gönder'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
