'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBranches } from '@/hooks/use-branch';
import { useMenus, useCategories, useCreateMenu, useCreateCategory, useDeleteCategory } from '@/hooks/use-menu';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MenuManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { data: menus, isLoading: menusLoading } = useMenus(selectedBranchId);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const { data: categories, isLoading: categoriesLoading } = useCategories(selectedMenuId);

  const createMenu = useCreateMenu();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [categoryName, setCategoryName] = useState('');

  if (!user) return null;

  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert('Lütfen şube seçin');
      return;
    }
    createMenu.mutate(
      { name: menuName, branchId: selectedBranchId },
      {
        onSuccess: () => {
          setMenuName('');
          setShowMenuForm(false);
        },
      },
    );
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId) {
      alert('Lütfen menü seçin');
      return;
    }
    createCategory.mutate(
      { name: categoryName, menuId: selectedMenuId },
      {
        onSuccess: () => {
          setCategoryName('');
          setShowCategoryForm(false);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
            <p className="text-sm text-gray-600">{user.tenant.name}</p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            ← Dashboard'a Dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Branch Selection */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">1. Şube Seçin</h2>
          {branchesLoading ? (
            <p>Yükleniyor...</p>
          ) : branches && branches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranchId(branch.id);
                    setSelectedMenuId('');
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    selectedBranchId === branch.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold">{branch.name}</h3>
                  <p className="text-sm text-gray-600">{branch.city}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-gray-600">Henüz şube yok</p>
              <Link
                href="/admin/branches"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                İlk Şubeyi Oluştur
              </Link>
            </div>
          )}
        </div>

        {selectedBranchId && (
          <>
            {/* Menu Selection */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">2. Menü Seçin</h2>
                <button
                  onClick={() => setShowMenuForm(!showMenuForm)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  + Yeni Menü
                </button>
              </div>

              {showMenuForm && (
                <form onSubmit={handleCreateMenu} className="mb-4 rounded-lg bg-gray-50 p-4">
                  <input
                    type="text"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    placeholder="Menü adı (örn: Ana Menü)"
                    required
                    className="mb-2 w-full rounded-lg border px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createMenu.isPending}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      {createMenu.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMenuForm(false)}
                      className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}

              {menusLoading ? (
                <p>Yükleniyor...</p>
              ) : menus && menus.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {menus.map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => setSelectedMenuId(menu.id)}
                      className={`rounded-lg border-2 p-4 text-left transition ${
                        selectedMenuId === menu.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <h3 className="font-semibold">{menu.name}</h3>
                      <p className="text-sm text-gray-600">
                        {menu.categories?.length || 0} kategori
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Bu şube için henüz menü oluşturulmamış</p>
              )}
            </div>

            {/* Categories */}
            {selectedMenuId && (
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">3. Kategoriler</h2>
                  <button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    + Yeni Kategori
                  </button>
                </div>

                {showCategoryForm && (
                  <form onSubmit={handleCreateCategory} className="mb-4 rounded-lg bg-gray-50 p-4">
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Kategori adı (örn: Başlangıçlar)"
                      required
                      className="mb-2 w-full rounded-lg border px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={createCategory.isPending}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        {createCategory.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(false)}
                        className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                )}

                {categoriesLoading ? (
                  <p>Yükleniyor...</p>
                ) : categories && categories.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="rounded-lg border-2 border-gray-200 p-4"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-gray-600">
                              {category.products?.length || 0} ürün
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
                                deleteCategory.mutate(category.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                        <Link
                          href={`/admin/menu/category/${category.id}`}
                          className="mt-2 block rounded bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Ürünleri Yönet →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Bu menü için henüz kategori oluşturulmamış</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
