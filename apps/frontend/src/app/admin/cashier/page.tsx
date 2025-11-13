'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTables } from '@/hooks/use-table';
import { useBranches } from '@/hooks/use-branch';
import { useTableBill, useCreatePayment } from '@/hooks/use-payment';
import { useSocket } from '@/contexts/socket-context';
import { useQueryClient } from '@tanstack/react-query';

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'ONLINE';

export default function CashierPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const { data: branches } = useBranches();
  const { data: tables } = useTables();
  const { data: bill, isLoading: billLoading } = useTableBill(selectedTable);
  const createPayment = useCreatePayment();

  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Listen to real-time payment events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePaymentCompleted = () => {
      // Refetch tables
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    };

    const handleOrderStatusChange = () => {
      // Refetch tables in case order status affects display
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    };

    socket.on('payment:completed', handlePaymentCompleted);
    socket.on('order:status-changed', handleOrderStatusChange);

    return () => {
      socket.off('payment:completed', handlePaymentCompleted);
      socket.off('order:status-changed', handleOrderStatusChange);
    };
  }, [socket, isConnected, queryClient]);

  // Filter occupied tables by branch
  const occupiedTables = useMemo(() => {
    if (!tables) return [];
    return tables.filter(
      (table: any) =>
        table.status === 'OCCUPIED' &&
        table.isActive &&
        (!selectedBranch || table.branchId === selectedBranch)
    );
  }, [tables, selectedBranch]);

  const handlePayment = () => {
    if (!selectedTable) return;

    createPayment.mutate(
      {
        tableId: selectedTable,
        method: paymentMethod,
        tipAmount: tipAmount || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowPaymentModal(false);
          setSelectedTable('');
          setTipAmount(0);
          setNotes('');
        },
      }
    );
  };

  const getFinalTotal = () => {
    if (!bill) return 0;
    return parseFloat(bill.summary.total) + (tipAmount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💰 Kasa / Adisyon</h1>
              <p className="text-sm text-gray-600">Ödeme al ve masaları kapat</p>
            </div>
          </div>

          {/* Branch Filter */}
          {branches && branches.length > 1 && (
            <div className="max-w-xs mt-4">
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSelectedTable('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Active Tables */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Aktif Masalar ({occupiedTables.length})
              </h2>

              {occupiedTables.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-500">Tüm masalar boş</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {occupiedTables.map((table: any) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                        selectedTable === table.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Masa {table.number}
                            {table.name && <span className="text-gray-600"> ({table.name})</span>}
                          </p>
                          <p className="text-sm text-gray-600">{table.branch?.name}</p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          DOLU
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Bill/Adisyon */}
          <div className="lg:col-span-2">
            {!selectedTable ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🧾</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Masa Seçin</h2>
                <p className="text-gray-600">Adisyonu görmek için bir masa seçin</p>
              </div>
            ) : billLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Adisyon yükleniyor...</p>
              </div>
            ) : bill ? (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Bill Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Adisyon</h2>
                      <p className="text-gray-600 mt-1">
                        Masa {bill.table.number}
                        {bill.table.name && ` (${bill.table.name})`}
                      </p>
                      <p className="text-sm text-gray-500">{bill.table.branch.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{bill.summary.orderCount} Sipariş</p>
                      <p className="text-sm text-gray-600">{bill.summary.itemCount} Ürün</p>
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div className="p-6 border-b max-h-96 overflow-y-auto">
                  <h3 className="font-bold text-gray-900 mb-4">Siparişler</h3>
                  <div className="space-y-6">
                    {bill.orders.map((order: any) => (
                      <div key={order.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">
                              {order.waiter
                                ? `${order.waiter.firstName} ${order.waiter.lastName}`
                                : 'QR Sipariş'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.quantity}x {item.product.name}
                                {item.variant && ` (${item.variant.name})`}
                                {item.notes && (
                                  <span className="text-gray-500 italic"> - {item.notes}</span>
                                )}
                              </span>
                              <span className="font-medium text-gray-900">
                                ₺{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 bg-gray-50">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Ara Toplam</span>
                      <span>₺{bill.summary.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>KDV (%{bill.summary.taxRate})</span>
                      <span>₺{bill.summary.tax}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                      <span>Toplam</span>
                      <span>₺{bill.summary.total}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
                  >
                    Ödeme Al
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && bill && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ödeme Al</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ödeme Yöntemi
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">💵 Nakit</span>
                      {paymentMethod === 'CASH' && <span className="text-green-600">✓</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">💳 Kredi Kartı</span>
                      {paymentMethod === 'CREDIT_CARD' && <span className="text-green-600">✓</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Tip Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bahşiş (opsiyonel)
                </label>
                <input
                  type="number"
                  value={tipAmount || ''}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar (opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ödeme notu..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Tutar</span>
                    <span>₺{bill.summary.total}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Bahşiş</span>
                      <span>₺{tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Ödenecek Tutar</span>
                    <span>₺{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handlePayment}
                  disabled={createPayment.isPending}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {createPayment.isPending ? 'İşleniyor...' : 'Ödemeyi Al'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
