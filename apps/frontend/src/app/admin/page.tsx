'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🍽️ Omasa</h1>
            <p className="text-sm text-gray-600">{user.tenant.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Hoş geldiniz, {user.firstName}! 👋
          </h2>
          <p className="text-gray-600">Restoran yönetim panelinize hoş geldiniz.</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <a href="/admin/menu" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition">
            <div className="mb-2 text-3xl">📱</div>
            <h3 className="mb-1 text-lg font-semibold">QR Menü</h3>
            <p className="text-sm text-gray-600">Menülerinizi yönetin</p>
            <div className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Menülere Git →
            </div>
          </a>

          <a href="/admin/tables" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition">
            <div className="mb-2 text-3xl">🪑</div>
            <h3 className="mb-1 text-lg font-semibold">Masalar</h3>
            <p className="text-sm text-gray-600">Masa ve QR kod yönetimi</p>
            <div className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Masalara Git →
            </div>
          </a>

          <a href="/admin/waiter" className="rounded-lg bg-green-600 p-6 shadow hover:shadow-lg transition text-white">
            <div className="mb-2 text-3xl">👨‍💼</div>
            <h3 className="mb-1 text-lg font-semibold">Sipariş Al</h3>
            <p className="text-sm text-green-100">Masadan sipariş</p>
            <div className="mt-4 text-sm font-semibold text-white hover:text-green-100">
              Sipariş Almaya Git →
            </div>
          </a>

          <a href="/admin/orders" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition">
            <div className="mb-2 text-3xl">📋</div>
            <h3 className="mb-1 text-lg font-semibold">Siparişler</h3>
            <p className="text-sm text-gray-600">Aktif siparişleri görüntüle</p>
            <div className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Siparişlere Git →
            </div>
          </a>

          <a href="/admin/kitchen" className="rounded-lg bg-orange-500 p-6 shadow hover:shadow-lg transition text-white">
            <div className="mb-2 text-3xl">🍳</div>
            <h3 className="mb-1 text-lg font-semibold">Mutfak Ekranı</h3>
            <p className="text-sm text-orange-100">Sipariş hazırlama</p>
            <div className="mt-4 text-sm font-semibold text-white hover:text-orange-100">
              Mutfağa Git →
            </div>
          </a>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-2 text-3xl">📊</div>
            <h3 className="mb-1 text-lg font-semibold">Raporlar</h3>
            <p className="text-sm text-gray-600">Satış ve performans</p>
            <button className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Raporlara Git →
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">Hızlı İstatistikler</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-gray-600">Bugün Toplam Satış</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₺0</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-gray-600">Aktif Siparişler</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-gray-600">Dolu Masalar</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <h3 className="mb-2 text-xl font-semibold text-gray-900">🚀 Başlarken</h3>
          <p className="mb-6 text-gray-600">
            Restoran sisteminizi kurmak için aşağıdaki adımları tamamlayın
          </p>
          <div className="grid gap-4 text-left md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-2xl">1️⃣</div>
              <h4 className="mb-1 font-semibold">Menü Oluştur</h4>
              <p className="text-sm text-gray-600">Ürünlerinizi ve kategorilerinizi ekleyin</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-2xl">2️⃣</div>
              <h4 className="mb-1 font-semibold">Masaları Tanımla</h4>
              <p className="text-sm text-gray-600">Masalarınızı ekleyin ve QR kodları oluşturun</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-2xl">3️⃣</div>
              <h4 className="mb-1 font-semibold">Kullanıcı Ekle</h4>
              <p className="text-sm text-gray-600">Garson ve mutfak personeli ekleyin</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
