'use client';

import { useState, useEffect } from 'react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-order';
import { useBranches } from '@/hooks/use-branch';
import { useSocket } from '@/contexts/socket-context';
import { useQueryClient } from '@tanstack/react-query';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'COMPLETED';

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  total: string;
  customerName?: string;
  customerPhone?: string;
  customerNote?: string;
  table: {
    number: string;
    name?: string;
    branch: {
      name: string;
    };
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    notes?: string;
    product: {
      name: string;
      image?: string;
    };
    variant?: {
      name: string;
    };
  }>;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-300',
  READY: 'bg-green-100 text-green-800 border-green-300',
  SERVED: 'bg-purple-100 text-purple-800 border-purple-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PREPARING: 'Hazırlanıyor',
  READY: 'Hazır',
  SERVED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: ['COMPLETED'],
  CANCELLED: [],
  COMPLETED: [],
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: branches } = useBranches();
  const { data: orders, isLoading } = useOrders(
    selectedBranch || undefined,
    selectedStatus !== 'ALL' ? selectedStatus : undefined
  );
  const updateStatus = useUpdateOrderStatus();

  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Listen to real-time order events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = () => {
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    const handleOrderStatusChange = () => {
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status-changed', handleOrderStatusChange);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status-changed', handleOrderStatusChange);
    };
  }, [socket, isConnected, queryClient]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="text-gray-600 mt-2">Tüm siparişlerinizi görüntüleyin ve yönetin</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'ALL')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tüm Siparişler</option>
                <option value="PENDING">Bekliyor</option>
                <option value="CONFIRMED">Onaylandı</option>
                <option value="PREPARING">Hazırlanıyor</option>
                <option value="READY">Hazır</option>
                <option value="SERVED">Teslim Edildi</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal Edildi</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şube</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Şubeler</option>
                {branches?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Siparişler yükleniyor...</p>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && orders && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">Sipariş bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders.map((order: Order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  >
                    {/* Order Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            Masa {order.table.number} {order.table.name && `(${order.table.name})`}
                          </p>
                          <p className="text-xs text-gray-500">{order.table.branch.name}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{order.type === 'QR' ? '🔗 QR Sipariş' : '👤 Garson'}</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.product.name}
                              {item.variant && ` (${item.variant.name})`}
                            </span>
                            <span className="font-medium text-gray-900">
                              ₺{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{order.items.length - 3} ürün daha...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Toplam</span>
                        <span className="text-xl font-bold text-gray-900">₺{order.total}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Detay
                        </button>
                        {statusTransitions[order.status].length > 0 && (
                          <div className="flex-1 flex gap-2">
                            {statusTransitions[order.status].map((nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() => handleStatusChange(order.id, nextStatus)}
                                disabled={updateStatus.isPending}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  nextStatus === 'CANCELLED'
                                    ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {nextStatus === 'CANCELLED' ? '❌' : statusLabels[nextStatus]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                    <p className="text-gray-600 mt-1">
                      Masa {selectedOrder.table.number} {selectedOrder.table.name && `(${selectedOrder.table.name})`}
                    </p>
                    <p className="text-sm text-gray-500">{selectedOrder.table.branch.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Order Info */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                        statusColors[selectedOrder.status]
                      }`}
                    >
                      {statusLabels[selectedOrder.status]}
                    </span>
                    <span className="text-sm text-gray-600">
                      {selectedOrder.type === 'QR' ? '🔗 QR Sipariş' : '👤 Garson Siparişi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Sipariş Zamanı:</span>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    {selectedOrder.confirmedAt && (
                      <div>
                        <span className="text-gray-600">Onay Zamanı:</span>
                        <p className="font-medium">{new Date(selectedOrder.confirmedAt).toLocaleString('tr-TR')}</p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.customerNote && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">Müşteri Notu:</p>
                      <p className="text-sm text-yellow-800 mt-1">{selectedOrder.customerNote}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Detayları</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                            {item.variant && <span className="text-gray-600"> ({item.variant.name})</span>}
                          </p>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">Not: {item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{item.quantity} adet</p>
                          <p className="font-semibold text-gray-900">
                            ₺{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ara Toplam</span>
                      <span className="font-medium">₺{selectedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">KDV (%10)</span>
                      <span className="font-medium">₺{selectedOrder.tax}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Toplam</span>
                      <span>₺{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                {statusTransitions[selectedOrder.status].length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sipariş Durumunu Değiştir</h3>
                    <div className="flex gap-2">
                      {statusTransitions[selectedOrder.status].map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, nextStatus);
                            setSelectedOrder(null);
                          }}
                          disabled={updateStatus.isPending}
                          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                            nextStatus === 'CANCELLED'
                              ? 'bg-red-100 hover:bg-red-200 text-red-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {statusLabels[nextStatus]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
