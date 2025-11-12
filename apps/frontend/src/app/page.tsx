export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">
          🍽️ Omasa
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          QR Menü ve Restoran Yönetim Sistemi
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/admin"
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Admin Panel
          </a>
          <a
            href="/menu"
            className="rounded-lg border-2 border-blue-600 px-8 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            QR Menü Demo
          </a>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 text-4xl">📱</div>
            <h3 className="mb-2 font-semibold">QR Menü</h3>
            <p className="text-sm text-gray-600">
              Müşteriler QR kod ile sipariş verebilir
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 text-4xl">👨‍🍳</div>
            <h3 className="mb-2 font-semibold">Mutfak Yönetimi</h3>
            <p className="text-sm text-gray-600">
              Siparişleri gerçek zamanlı takip edin
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 text-4xl">💳</div>
            <h3 className="mb-2 font-semibold">Ödeme Sistemi</h3>
            <p className="text-sm text-gray-600">
              Online ve nakit ödeme desteği
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
