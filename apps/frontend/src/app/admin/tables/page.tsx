'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBranches } from '@/hooks/use-branch';
import {
  useTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useRegenerateQR,
  TableStatus,
} from '@/hooks/use-table';
import Link from 'next/link';
import QRCode from 'qrcode';

export default function TablesPage() {
  const { user } = useAuth();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { data: tables, isLoading: tablesLoading } = useTables(selectedBranchId);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const regenerateQR = useRegenerateQR();

  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: '4',
    area: '',
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert('Lütfen şube seçin');
      return;
    }

    const data: any = {
      number: formData.number,
      branchId: selectedBranchId,
      capacity: parseInt(formData.capacity),
    };

    if (formData.name) data.name = formData.name;
    if (formData.area) data.area = formData.area;

    if (editingTable) {
      updateTable.mutate(
        { id: editingTable.id, data },
        {
          onSuccess: () => {
            setFormData({ number: '', name: '', capacity: '4', area: '' });
            setEditingTable(null);
            setShowTableForm(false);
          },
        },
      );
    } else {
      createTable.mutate(data, {
        onSuccess: () => {
          setFormData({ number: '', name: '', capacity: '4', area: '' });
          setShowTableForm(false);
        },
      });
    }
  };

  const handleEdit = (table: any) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      name: table.name || '',
      capacity: table.capacity.toString(),
      area: table.area || '',
    });
    setShowTableForm(true);
  };

  const handleShowQR = async (table: any) => {
    setSelectedTable(table);
    setShowQRModal(true);

    // Generate QR code
    setTimeout(async () => {
      if (qrCanvasRef.current) {
        const qrUrl = `${window.location.origin}/qr/${table.qrCode}`;
        await QRCode.toCanvas(qrCanvasRef.current, qrUrl, {
          width: 300,
          margin: 2,
        });
      }
    }, 100);
  };

  const handleDownloadQR = async () => {
    if (!selectedTable) return;

    const qrUrl = `${window.location.origin}/qr/${selectedTable.qrCode}`;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, qrUrl, { width: 600, margin: 4 });

    const link = document.createElement('a');
    link.download = `Masa-${selectedTable.number}-QR.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getStatusBadge = (status: TableStatus) => {
    const styles = {
      EMPTY: 'bg-green-100 text-green-700',
      OCCUPIED: 'bg-red-100 text-red-700',
      RESERVED: 'bg-yellow-100 text-yellow-700',
      CLEANING: 'bg-gray-100 text-gray-700',
    };

    const labels = {
      EMPTY: 'Boş',
      OCCUPIED: 'Dolu',
      RESERVED: 'Rezerve',
      CLEANING: 'Temizleniyor',
    };

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Masa Yönetimi</h1>
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
                  onClick={() => setSelectedBranchId(branch.id)}
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
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">2. Masalar</h2>
              <button
                onClick={() => {
                  setEditingTable(null);
                  setFormData({ number: '', name: '', capacity: '4', area: '' });
                  setShowTableForm(!showTableForm);
                }}
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                + Yeni Masa
              </button>
            </div>

            {/* Table Form */}
            {showTableForm && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-4 font-semibold">
                  {editingTable ? 'Masayı Düzenle' : 'Yeni Masa Ekle'}
                </h3>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Masa No *</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">İsim</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      placeholder="VIP Masa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kapasite *</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                      min="1"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alan</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      placeholder="Bahçe, Teras, İç Salon"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={createTable.isPending || updateTable.isPending}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {createTable.isPending || updateTable.isPending
                        ? 'Kaydediliyor...'
                        : editingTable
                          ? 'Güncelle'
                          : 'Oluştur'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTableForm(false);
                        setEditingTable(null);
                        setFormData({ number: '', name: '', capacity: '4', area: '' });
                      }}
                      className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tables List */}
            {tablesLoading ? (
              <div className="text-center">Yükleniyor...</div>
            ) : tables && tables.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tables.map((table) => (
                  <div key={table.id} className="rounded-lg border-2 border-gray-200 p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Masa {table.number}
                          {table.name && <span className="text-gray-600"> · {table.name}</span>}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {table.capacity} kişilik
                          {table.area && ` · ${table.area}`}
                        </p>
                      </div>
                      {getStatusBadge(table.status)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleShowQR(table)}
                        className="rounded bg-purple-600 px-3 py-1 text-sm font-semibold text-white hover:bg-purple-700"
                      >
                        📱 QR Kod
                      </button>
                      <button
                        onClick={() => handleEdit(table)}
                        className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('QR kodu yenilemek istediğinizden emin misiniz?')) {
                            regenerateQR.mutate(table.id);
                          }
                        }}
                        className="rounded bg-yellow-600 px-3 py-1 text-sm font-semibold text-white hover:bg-yellow-700"
                      >
                        🔄 QR
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bu masayı silmek istediğinizden emin misiniz?')) {
                            deleteTable.mutate(table.id);
                          }
                        }}
                        className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600">
                Bu şube için henüz masa oluşturulmamış
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Masa {selectedTable.number} - QR Kod
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4 flex justify-center">
              <canvas ref={qrCanvasRef} />
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">QR Kod URL:</p>
              <p className="break-all font-mono text-xs">
                {window.location.origin}/qr/{selectedTable.qrCode}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                📥 İndir
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
