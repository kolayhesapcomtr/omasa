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

### ✅ Tamamlandı (v1.0)
- [x] Proje yapısı ve altyapı kurulumu
- [x] Database schema tasarımı (Prisma + PostgreSQL)
- [x] Authentication & Authorization (JWT + Role-based)
- [x] Multi-tenant mimari
- [x] Şube yönetimi
- [x] Menü yönetimi (Kategoriler, Ürünler, Varyantlar)
- [x] Masa yönetimi ve QR kod sistemi
- [x] Public QR Menü sayfası
- [x] Sipariş yönetimi (Admin)
- [x] Mutfak ekranı (Kitchen Display)
- [x] Garson sipariş alma ekranı
- [x] Kasa ve ödeme sistemi
- [x] Kullanıcı ve personel yönetimi
- [x] Raporlama ve analitik (Satış, Ürün, Garson performansı)
- [x] Real-time bildirimler (Socket.io + WebSocket)
- [x] Docker & Production deployment setup

### 🚀 Gelecek Sürümler
- [ ] Email bildirimleri (SMTP)
- [ ] SMS bildirimleri (Twilio/Netgsm)
- [ ] iyzico ödeme entegrasyonu
- [ ] Rezervasyon sistemi
- [ ] Müşteri CRM
- [ ] Sadakat programı
- [ ] Mobil uygulama (React Native)
- [ ] Stok takip sistemi
- [ ] Çoklu dil desteği (i18n)

## 🚀 Deployment

### Hızlı Deployment (Docker)

```bash
# 1. Projeyi clone'layın
git clone <repo-url>
cd omasa

# 2. Environment değişkenlerini ayarlayın
cp .env.example .env
nano .env  # JWT_SECRET, DATABASE_URL vb. ayarlayın

# 3. Deploy script'ini çalıştırın
./scripts/deploy.sh production
```

### Manuel Deployment

Detaylı deployment rehberi için: **[DEPLOYMENT.md](DEPLOYMENT.md)**

- Docker Compose deployment
- VPS/Cloud Server deployment
- Kubernetes deployment
- SSL sertifikası kurulumu
- Database migration stratejileri
- Backup ve restore prosedürleri
- Monitoring ve maintenance

### Hazır Scripts

```bash
# Deployment
./scripts/deploy.sh production

# Database backup
./scripts/backup.sh

# Database restore
./scripts/restore.sh backups/backup_file.sql.gz
```

---

**Omasa** ile restoranınızı dijital çağa taşıyın! 🚀