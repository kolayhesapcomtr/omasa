'use client';

import { useState, useEffect, useRef } from 'react';
import { useKitchenOrders, useUpdateOrderStatus } from '@/hooks/use-order';
import { useBranches } from '@/hooks/use-branch';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY';

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: OrderStatus;
  table: {
    number: string;
    name?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    notes?: string;
    product: {
      name: string;
    };
    variant?: {
      name: string;
    };
  }>;
  customerNote?: string;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-400 border-yellow-500',
  CONFIRMED: 'bg-blue-400 border-blue-500',
  PREPARING: 'bg-orange-400 border-orange-500',
  READY: 'bg-green-400 border-green-500',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'YENİ SİPARİŞ',
  CONFIRMED: 'ONAYLANDI',
  PREPARING: 'HAZIRLANIYOR',
  READY: 'HAZIR',
};

const statusActions: Record<OrderStatus, { label: string; nextStatus: OrderStatus; color: string }[]> = {
  PENDING: [{ label: 'BAŞLA', nextStatus: 'CONFIRMED', color: 'bg-blue-600 hover:bg-blue-700' }],
  CONFIRMED: [{ label: 'HAZIRLANIYOR', nextStatus: 'PREPARING', color: 'bg-orange-600 hover:bg-orange-700' }],
  PREPARING: [{ label: 'HAZIR', nextStatus: 'READY', color: 'bg-green-600 hover:bg-green-700' }],
  READY: [],
};

export default function KitchenPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [previousOrderCount, setPreviousOrderCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: branches } = useBranches();
  const { data: orders, isLoading } = useKitchenOrders(selectedBranch || undefined);
  const updateStatus = useUpdateOrderStatus();

  // Play sound on new order
  useEffect(() => {
    if (orders && orders.length > previousOrderCount) {
      // New order detected
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }
    if (orders) {
      setPreviousOrderCount(orders.length);
    }
  }, [orders, previousOrderCount]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
  };

  const getElapsedTime = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}s ${mins}dk önce`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const groupedOrders = orders?.reduce(
    (acc: Record<OrderStatus, Order[]>, order: Order) => {
      if (!acc[order.status]) acc[order.status] = [];
      acc[order.status].push(order);
      return acc;
    },
    {} as Record<OrderStatus, Order[]>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Audio for notification */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold">🍳 MUTFAK EKRANI</h1>
            <p className="text-gray-400 text-lg mt-2">Bekleyen ve hazırlanan siparişler</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{orders?.length || 0}</p>
            <p className="text-gray-400">Aktif Sipariş</p>
          </div>
        </div>

        {/* Branch Filter */}
        {branches && branches.length > 1 && (
          <div className="max-w-xs">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tüm Şubeler</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-4 text-xl">Siparişler yükleniyor...</p>
        </div>
      )}

      {/* Orders Grid by Status */}
      {!isLoading && groupedOrders && (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
          {/* PENDING Column */}
          {groupedOrders.PENDING && groupedOrders.PENDING.length > 0 && (
            <div>
              <div className="bg-yellow-500 text-black px-4 py-3 rounded-t-lg font-bold text-xl text-center">
                YENİ SİPARİŞLER ({groupedOrders.PENDING.length})
              </div>
              <div className="space-y-4 mt-4">
                {groupedOrders.PENDING.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    getElapsedTime={getElapsedTime}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CONFIRMED Column */}
          {groupedOrders.CONFIRMED && groupedOrders.CONFIRMED.length > 0 && (
            <div>
              <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl text-center">
                ONAYLANDI ({groupedOrders.CONFIRMED.length})
              </div>
              <div className="space-y-4 mt-4">
                {groupedOrders.CONFIRMED.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    getElapsedTime={getElapsedTime}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PREPARING Column */}
          {groupedOrders.PREPARING && groupedOrders.PREPARING.length > 0 && (
            <div>
              <div className="bg-orange-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl text-center">
                HAZIRLANIYOR ({groupedOrders.PREPARING.length})
              </div>
              <div className="space-y-4 mt-4">
                {groupedOrders.PREPARING.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    getElapsedTime={getElapsedTime}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* READY Column */}
          {groupedOrders.READY && groupedOrders.READY.length > 0 && (
            <div>
              <div className="bg-green-500 text-white px-4 py-3 rounded-t-lg font-bold text-xl text-center">
                HAZIR ({groupedOrders.READY.length})
              </div>
              <div className="space-y-4 mt-4">
                {groupedOrders.READY.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    getElapsedTime={getElapsedTime}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!orders || orders.length === 0) && (
        <div className="text-center py-20">
          <div className="text-8xl mb-4">✅</div>
          <p className="text-3xl font-bold text-gray-400">Tüm siparişler tamamlandı!</p>
          <p className="text-xl text-gray-500 mt-2">Yeni sipariş beklenmiyor</p>
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  getElapsedTime: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

function OrderCard({ order, onStatusChange, getElapsedTime, formatTime }: OrderCardProps) {
  const actions = statusActions[order.status];

  return (
    <div className={`${statusColors[order.status]} rounded-lg border-4 shadow-xl overflow-hidden`}>
      {/* Card Header */}
      <div className="bg-black bg-opacity-30 px-4 py-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-white">{order.orderNumber}</h3>
            <p className="text-lg text-white">
              Masa {order.table.number} {order.table.name && `(${order.table.name})`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">{getElapsedTime(order.createdAt)}</p>
            <p className="text-sm text-white">{formatTime(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white text-black p-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="border-b-2 border-gray-300 pb-3 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                    {item.quantity}x {item.product.name}
                  </p>
                  {item.variant && <p className="text-lg text-gray-700 mt-1">({item.variant.name})</p>}
                  {item.notes && (
                    <div className="mt-2 bg-yellow-100 border-2 border-yellow-400 rounded px-3 py-2">
                      <p className="text-sm font-semibold text-yellow-900">📝 NOT:</p>
                      <p className="text-lg font-medium text-yellow-900">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Note */}
        {order.customerNote && (
          <div className="mt-4 bg-red-100 border-4 border-red-500 rounded-lg p-3">
            <p className="text-sm font-bold text-red-900 uppercase">⚠️ Müşteri Notu:</p>
            <p className="text-xl font-bold text-red-900 mt-1">{order.customerNote}</p>
          </div>
        )}

        {/* Order Type Badge */}
        <div className="mt-4">
          <span className="inline-block bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {order.type === 'QR' ? '🔗 QR Sipariş' : '👤 Garson'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="bg-gray-800 p-4">
          {actions.map((action) => (
            <button
              key={action.nextStatus}
              onClick={() => onStatusChange(order.id, action.nextStatus)}
              className={`w-full ${action.color} text-white text-2xl font-bold py-4 rounded-lg transition-colors shadow-lg`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
