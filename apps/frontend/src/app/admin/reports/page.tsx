'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  useSalesOverview,
  useProductSales,
  useWaiterPerformance,
  useDailySales,
  useCategorySales,
  useRevenueByHour,
  type ReportPeriod,
  type ReportsQuery,
} from '@/hooks/use-reports';

export default function ReportsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('TODAY');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'waiters' | 'trends'>('overview');

  const query: ReportsQuery = { period };

  const salesOverview = useSalesOverview(query);
  const productSales = useProductSales(query);
  const waiterPerformance = useWaiterPerformance(query);
  const dailySales = useDailySales(query);
  const categorySales = useCategorySales(query);
  const revenueByHour = useRevenueByHour(query);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const periodLabels: Record<ReportPeriod, string> = {
    TODAY: 'Bugün',
    YESTERDAY: 'Dün',
    THIS_WEEK: 'Bu Hafta',
    LAST_WEEK: 'Geçen Hafta',
    THIS_MONTH: 'Bu Ay',
    LAST_MONTH: 'Geçen Ay',
    CUSTOM: 'Özel',
  };

  const paymentMethodLabels: Record<string, string> = {
    CASH: 'Nakit',
    CREDIT_CARD: 'Kredi Kartı',
    ONLINE: 'Online',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Raporlar</h1>
            <p className="text-sm text-gray-600">{user.tenant.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ← Geri
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Period Selector */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-lg bg-white p-2 shadow">
          {(Object.keys(periodLabels) as ReportPeriod[])
            .filter((p) => p !== 'CUSTOM')
            .map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'products'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ürün Satışları
          </button>
          <button
            onClick={() => setActiveTab('waiters')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'waiters'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Garson Performansı
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'trends'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trendler
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            {salesOverview.data && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Özet Metrikler</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-white p-6 shadow">
                    <p className="text-sm text-gray-600">Toplam Gelir</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {formatCurrency(salesOverview.data.totalRevenue)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-6 shadow">
                    <p className="text-sm text-gray-600">Sipariş Sayısı</p>
                    <p className="mt-2 text-3xl font-bold text-blue-600">
                      {salesOverview.data.totalOrders}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-6 shadow">
                    <p className="text-sm text-gray-600">Ortalama Hesap</p>
                    <p className="mt-2 text-3xl font-bold text-purple-600">
                      {formatCurrency(salesOverview.data.averageOrderValue)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-6 shadow">
                    <p className="text-sm text-gray-600">Toplam Bahşiş</p>
                    <p className="mt-2 text-3xl font-bold text-orange-600">
                      {formatCurrency(salesOverview.data.totalTips)}
                    </p>
                  </div>
                </div>

                {/* Order Status */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-6 shadow">
                    <h4 className="mb-4 font-semibold text-gray-900">Sipariş Durumu</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tamamlanan</span>
                        <span className="font-semibold text-green-600">
                          {salesOverview.data.completedOrders}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">İptal Edilen</span>
                        <span className="font-semibold text-red-600">
                          {salesOverview.data.cancelledOrders}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-6 shadow">
                    <h4 className="mb-4 font-semibold text-gray-900">Ödeme Yöntemleri</h4>
                    <div className="space-y-3">
                      {salesOverview.data.paymentMethods.map((pm) => (
                        <div key={pm.method} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {paymentMethodLabels[pm.method] || pm.method}
                          </span>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(pm.total)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">({pm.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Sales */}
            {categorySales.data && categorySales.data.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Kategori Satışları</h3>
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="space-y-4">
                    {categorySales.data.map((cat) => (
                      <div key={cat.categoryId}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-gray-900">{cat.categoryName}</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(cat.revenue)} ({cat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{cat.totalQuantity} adet</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">En Çok Satan Ürünler</h3>
            {productSales.data && productSales.data.length > 0 ? (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Ürün
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Satılan Adet
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Sipariş Sayısı
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Toplam Gelir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productSales.data.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {product.categoryName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          {product.quantitySold}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-600">
                          {product.timesOrdered}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-green-600">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">Bu dönem için ürün satışı bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {/* Waiters Tab */}
        {activeTab === 'waiters' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Garson Performansı</h3>
            {waiterPerformance.data && waiterPerformance.data.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {waiterPerformance.data.map((waiter) => (
                  <div key={waiter.waiterId} className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-600">
                        {waiter.waiterName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{waiter.waiterName}</h4>
                        <p className="text-sm text-gray-500">Garson</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sipariş Sayısı</span>
                        <span className="font-semibold text-gray-900">{waiter.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Toplam Gelir</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(waiter.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ortalama Hesap</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(waiter.averageOrderValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Toplam Bahşiş</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(waiter.totalTips)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">Bu dönem için garson performans verisi bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Daily Sales */}
            {dailySales.data && dailySales.data.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Günlük Satış Trendi</h3>
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                          Sipariş Sayısı
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                          Toplam Gelir
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                          Ortalama
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dailySales.data.map((day) => (
                        <tr key={day.date} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                            {day.orders}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-green-600">
                            {formatCurrency(day.revenue)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-600">
                            {formatCurrency(day.averageOrderValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Revenue by Hour */}
            {revenueByHour.data && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Saatlik Gelir Dağılımı</h3>
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="grid grid-cols-12 gap-2">
                    {revenueByHour.data
                      .filter((h) => h.revenue > 0)
                      .map((hour) => {
                        const maxRevenue = Math.max(...revenueByHour.data.map((h) => h.revenue));
                        const heightPercent = (hour.revenue / maxRevenue) * 100;
                        return (
                          <div key={hour.hour} className="flex flex-col items-center">
                            <div className="mb-2 flex h-32 w-full items-end">
                              <div
                                className="w-full rounded-t bg-blue-600"
                                style={{ height: `${heightPercent}%` }}
                                title={`${formatCurrency(hour.revenue)} (${hour.orders} sipariş)`}
                              />
                            </div>
                            <div className="text-xs text-gray-600">{hour.hour}:00</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
