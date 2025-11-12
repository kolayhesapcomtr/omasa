# 🍽️ Omasa - QR Menü ve Restoran Yönetim Sistemi

Modern, ölçeklenebilir ve kullanımı kolay QR menü ve restoran yönetim sistemi. Restoran, cafe ve benzeri işletmeler için tam kapsamlı SaaS çözümü.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **QR Menü** - Müşteriler QR kod okutarak menüyü görüntüler ve sipariş verir
- **Masa Yönetimi** - Masa durumları, rezervasyonlar ve QR kod yönetimi
- **Sipariş Yönetimi** - Gerçek zamanlı sipariş takibi ve durum güncellemeleri
- **Mutfak Ekranı** - Mutfak için özel sipariş hazırlama ekranı
- **Garson Panel** - Garsonlar için sipariş alma ve yönetim ekranı
- **Kasa/Ödeme** - Nakit, kart ve online ödeme desteği
- **Menü Yönetimi** - Kategoriler, ürünler, fiyatlar ve varyantlar
- **Multi-Tenant** - Her restoran kendi bağımsız paneline sahip
- **Raporlama** - Satış, ürün ve garson performans raporları

### 🚀 İleri Seviye
- Gerçek zamanlı bildirimler (WebSocket)
- Çoklu şube desteği
- Rol bazlı erişim kontrolü
- Responsive tasarım (Mobil/Tablet/Desktop)
- Çoklu dil desteği (TR/EN)
- iyzico ödeme entegrasyonu

## 🏗️ Teknoloji Stack

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis
- **Real-time**: Socket.io
- **Auth**: JWT + bcrypt
- **Validation**: class-validator
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.io Client

### DevOps
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Containerization**: Docker + Docker Compose

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### 1. Projeyi Clone'layın
```bash
git clone <repo-url>
cd omasa
```

### 2. Bağımlılıkları Yükleyin
```bash
pnpm install
```

### 3. Docker ile Database Başlatın
```bash
docker-compose up -d
```

### 4. Environment Dosyalarını Ayarlayın
```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend (.env.local zaten oluşturuldu)
```

### 5. Database Migration
```bash
cd apps/backend
pnpm prisma migrate dev
pnpm prisma generate
```

### 6. Uygulamayı Başlatın
```bash
# Root dizinden (tüm uygulamaları başlatır)
pnpm dev
```

## 🚀 Çalıştırma

Uygulamalar başlatıldıktan sonra:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **API Docs**: http://localhost:4000/api/docs
- **Database**: postgresql://localhost:5432/omasa
- **Redis**: localhost:6379

## 📁 Proje Yapısı

```
omasa/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── modules/      # Feature modülleri
│   │   │   ├── common/       # Paylaşılan kodlar
│   │   │   └── config/       # Yapılandırma
│   │   └── prisma/           # Database schema
│   │
│   └── frontend/             # Next.js Uygulaması
│       ├── src/
│       │   ├── app/          # Next.js app router
│       │   ├── components/   # React bileşenleri
│       │   ├── lib/          # Utility fonksiyonları
│       │   └── hooks/        # Custom hooks
│       └── public/           # Statik dosyalar
│
├── docker-compose.yml        # Docker yapılandırması
└── turbo.json               # Turborepo config
```

## 🎯 Geliştirme Roadmap

Detaylı görev listesi için: [PROJECT_PLAN.md](PROJECT_PLAN.md)

### ✅ Faz 1 - MVP (Şu An)
- [x] Proje yapısı ve altyapı
- [x] Database schema tasarımı
- [ ] Authentication & Authorization
- [ ] Menü yönetimi
- [ ] Sipariş sistemi
- [ ] Ödeme sistemi

---

**Omasa** ile restoranınızı dijital çağa taşıyın! 🚀