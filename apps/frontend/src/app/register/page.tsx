'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    tenantName: '',
    tenantSlug: '',
    tenantEmail: '',
    tenantPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from tenant name
    if (name === 'tenantName') {
      const slug = value
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, tenantSlug: slug }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">🍽️ Omasa</h1>
            <p className="text-gray-600">Restoranınızı kaydedin ve başlayın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Kişisel Bilgiler</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Ad *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Soyad *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Şifre * (min. 8 karakter)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+905551234567"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Restoran Bilgileri</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                    Restoran Adı *
                  </label>
                  <input
                    id="tenantName"
                    name="tenantName"
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="tenantSlug" className="block text-sm font-medium text-gray-700">
                    URL (otomatik oluşur)
                  </label>
                  <input
                    id="tenantSlug"
                    name="tenantSlug"
                    type="text"
                    required
                    value={formData.tenantSlug}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="restoran-adi"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    omasa.app/m/{formData.tenantSlug || 'restoran-adi'}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="tenantEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Restoran E-posta *
                  </label>
                  <input
                    id="tenantEmail"
                    name="tenantEmail"
                    type="email"
                    required
                    value={formData.tenantEmail}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tenantPhone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Restoran Telefon
                  </label>
                  <input
                    id="tenantPhone"
                    name="tenantPhone"
                    type="tel"
                    value={formData.tenantPhone}
                    onChange={handleChange}
                    placeholder="+905551234567"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegisterLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isRegisterLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol ve Başla (30 gün ücretsiz)'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Zaten hesabınız var mı? </span>
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Giriş Yap
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
