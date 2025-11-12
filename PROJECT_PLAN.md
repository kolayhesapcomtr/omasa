# OMASA - QR Menü ve Restoran Yönetim Sistemi
## Proje Planı ve Görev Listesi

### 📋 Proje Özeti
**Omasa** - Online masa açılımı ile restoran, cafe ve benzeri işletmeler için QR menü, adisyon, sipariş yönetimi ve ödeme sistemi içeren SaaS platform.

---

## 🏗️ Teknoloji Stack (En Stabil)

### Frontend
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.io Client

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis
- **Real-time**: Socket.io
- **Queue**: BullMQ
- **Auth**: JWT + bcrypt
- **Validation**: class-validator

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Frontend Deploy**: Vercel
- **Backend Deploy**: Railway / DigitalOcean
- **Storage**: AWS S3 / Cloudflare R2
- **CDN**: Cloudflare

### Payment & Integration
- **Payment Gateway**: iyzico
- **Email**: Resend / SendGrid
- **SMS**: Netgsm / İleti Merkezi

---

## 🎯 Faz 1: Temel Altyapı ve MVP (4-6 hafta)

### ✅ Adım 1: Proje Yapısı ve Kurulum (1-2 gün)
- [ ] Monorepo yapısı oluştur (Turborepo)
- [ ] Backend (NestJS) kurulumu
- [ ] Frontend (Next.js) kurulumu
- [ ] Database (PostgreSQL + Redis) Docker setup
- [ ] Prisma ORM yapılandırma
- [ ] ESLint, Prettier, Husky kurulumu
- [ ] Git workflow ve branch stratejisi

### ✅ Adım 2: Database Schema Tasarımı (2-3 gün)
- [ ] Multi-tenant mimari tasarımı
- [ ] Prisma schema oluşturma:
  - Tenant (Restaurant/Cafe)
  - User (Roller: Owner, Manager, Waiter, Cashier, Kitchen)
  - Menu (Category, Product, Variant, Price)
  - Table & QR Code
  - Order & OrderItem
  - Payment & Invoice
  - Subscription & Plan
- [ ] Migration oluşturma ve test
- [ ] Seed data hazırlama

### ✅ Adım 3: Authentication & Authorization (3-4 gün)
- [ ] JWT authentication modülü
- [ ] Multi-tenant context middleware
- [ ] Role-based access control (RBAC)
- [ ] Login/Register endpoints
- [ ] Password reset flow
- [ ] Email verification
- [ ] Frontend auth pages ve guards

### ✅ Adım 4: Tenant (Restoran) Yönetimi (3-4 gün)
- [ ] Restoran kayıt sistemi
- [ ] Şube yönetimi
- [ ] Kullanıcı yönetimi (CRUD)
- [ ] Rol atama sistemi
- [ ] Tenant settings
- [ ] Frontend admin panel layout

### ✅ Adım 5: Menü Yönetimi (5-6 gün)
- [ ] Kategori CRUD API
- [ ] Ürün CRUD API
- [ ] Varyant yönetimi (örn: Küçük/Orta/Büyük)
- [ ] Görsel upload sistemi (S3/Cloudflare)
- [ ] Görsel optimizasyon
- [ ] Menü sıralama/drag-drop
- [ ] Ürün aktif/pasif durumu
- [ ] Frontend menü yönetim sayfaları
- [ ] Menü önizleme

### ✅ Adım 6: Masa ve QR Kod Sistemi (3-4 gün)
- [ ] Masa tanımlama API
- [ ] QR kod oluşturma (unique hash)
- [ ] QR kod PDF export
- [ ] Masa durumu yönetimi (boş/dolu/rezerve)
- [ ] Masa layout/plan tasarımı
- [ ] Frontend masa yönetimi
- [ ] QR kod yazdırma sayfası

### ✅ Adım 7: Müşteri QR Menü Görünümü (4-5 gün)
- [ ] QR kod okuma ve yönlendirme
- [ ] Mobil-first menü tasarımı
- [ ] Kategoriye göre filtreleme
- [ ] Ürün detay modal/sayfası
- [ ] Sepet sistemi (local storage)
- [ ] Sipariş notu ekleme
- [ ] Sipariş gönderme
- [ ] Sipariş durumu takibi
- [ ] Çoklu dil desteği (TR/EN)

### ✅ Adım 8: Sipariş Yönetim Sistemi (5-6 gün)
- [ ] Sipariş oluşturma API (QR + Garson)
- [ ] Sipariş durum yönetimi (Bekliyor/Hazırlanıyor/Hazır/Teslim Edildi)
- [ ] Real-time sipariş bildirimleri (Socket.io)
- [ ] Garson sipariş girişi ekranı
- [ ] Mutfak ekranı (sipariş listesi)
- [ ] Sipariş detay ve düzenleme
- [ ] Sipariş iptal/iade
- [ ] Sipariş geçmişi

### ✅ Adım 9: Adisyon ve Ödeme Sistemi (5-6 gün)
- [ ] Adisyon oluşturma API
- [ ] Masa bazlı sipariş toplama
- [ ] Adisyon birleştirme/ayırma
- [ ] Nakit ödeme
- [ ] Kredi kartı ödeme (manuel)
- [ ] iyzico entegrasyonu (online ödeme)
- [ ] Fatura/fiş oluşturma
- [ ] Fiş yazdırma (PDF)
- [ ] Kasa ekranı
- [ ] Ödeme geçmişi

### ✅ Adım 10: Temel Raporlama (3-4 gün)
- [ ] Günlük satış raporu
- [ ] Ürün bazlı satış
- [ ] Ödeme yöntemi dağılımı
- [ ] Garson performansı
- [ ] Export (Excel/PDF)
- [ ] Dashboard grafikleri

### ✅ Adım 11: Testing ve Deployment (5-6 gün)
- [ ] Unit testler (Backend)
- [ ] Integration testler
- [ ] E2E testler (Playwright)
- [ ] Performance testleri
- [ ] Docker production build
- [ ] CI/CD pipeline
- [ ] Staging deployment
- [ ] Production deployment
- [ ] SSL sertifikası
- [ ] Domain ayarları

---

## 🚀 Faz 2: Gelişmiş Özellikler (4-6 hafta)

### İleri Seviye Özellikler
- [ ] Stok takip sistemi
- [ ] Rezervasyon modülü
- [ ] Müşteri CRM
- [ ] Sadakat programı
- [ ] Push notification
- [ ] Offline mode (PWA)
- [ ] Çoklu şube yönetimi
- [ ] Merkezi mutfak sistemi
- [ ] Mobil uygulama (React Native)
- [ ] Gelişmiş analizler ve AI önerileri
- [ ] Getir/Yemeksepeti entegrasyonu
- [ ] Muhasebe yazılımı entegrasyonu

---

## 📊 Database Schema Önizleme

```prisma
model Tenant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  logo          String?
  plan          Plan     @default(FREE)
  status        Status   @default(ACTIVE)
  branches      Branch[]
  users         User[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  role          Role
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  orders        Order[]
}

model Branch {
  id            String   @id @default(cuid())
  name          String
  address       String
  phone         String
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  tables        Table[]
  menus         Menu[]
}

model Menu {
  id            String   @id @default(cuid())
  name          String
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])
  categories    Category[]
}

model Category {
  id            String   @id @default(cuid())
  name          String
  order         Int
  menuId        String
  menu          Menu     @relation(fields: [menuId], references: [id])
  products      Product[]
}

model Product {
  id            String   @id @default(cuid())
  name          String
  description   String?
  image         String?
  price         Decimal
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  variants      Variant[]
  isActive      Boolean  @default(true)
}

model Table {
  id            String   @id @default(cuid())
  number        String
  qrCode        String   @unique
  capacity      Int
  status        TableStatus @default(EMPTY)
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])
  orders        Order[]
}

model Order {
  id            String   @id @default(cuid())
  orderNumber   String   @unique
  tableId       String
  table         Table    @relation(fields: [tableId], references: [id])
  waiterId      String?
  waiter        User?    @relation(fields: [waiterId], references: [id])
  items         OrderItem[]
  status        OrderStatus @default(PENDING)
  total         Decimal
  createdAt     DateTime @default(now())
  payment       Payment?
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id])
  productId     String
  quantity      Int
  price         Decimal
  notes         String?
}

model Payment {
  id            String   @id @default(cuid())
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  amount        Decimal
  method        PaymentMethod
  status        PaymentStatus
  paidAt        DateTime?
}

enum Role {
  OWNER
  MANAGER
  WAITER
  CASHIER
  KITCHEN
}

enum Plan {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}

enum TableStatus {
  EMPTY
  OCCUPIED
  RESERVED
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  SERVED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  ONLINE
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

---

## 🎨 UI/UX Sayfalar

### Admin Panel (Restaurant Owner/Manager)
1. Dashboard
2. Menü Yönetimi
3. Masa Yönetimi
4. QR Kod Yönetimi
5. Kullanıcı Yönetimi
6. Raporlar
7. Ayarlar
8. Abonelik/Fatura

### Garson Panel
1. Masa Durumu
2. Sipariş Alma
3. Aktif Siparişler
4. Sipariş Geçmişi

### Mutfak Ekranı
1. Bekleyen Siparişler
2. Hazırlanan Siparişler
3. Tamamlanan Siparişler

### Kasa Panel
1. Aktif Masalar
2. Adisyon Oluşturma
3. Ödeme Alma
4. Günlük Kasa Raporu

### Müşteri QR Menü
1. Menü Listesi
2. Ürün Detay
3. Sepet
4. Sipariş Özeti
5. Sipariş Takibi

---

## 🔧 Geliştirme Standartları

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- 80%+ test coverage
- Husky pre-commit hooks

### Security
- JWT token rotation
- Rate limiting
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Helmet.js
- Input validation (Zod/class-validator)

### Performance
- Database indexing
- Redis caching
- Image optimization (Next.js Image)
- Code splitting
- Lazy loading
- CDN usage

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- Logging (Winston/Pino)
- Uptime monitoring

---

## 📝 Notlar

- Multi-tenancy için Row Level Security (RLS) kullanılacak
- Tüm API endpoint'leri versiyonlanacak (/api/v1/...)
- WebSocket için namespace kullanılacak (tenant bazlı)
- QR kod format: `https://omasa.app/m/{tenantSlug}/{tableQR}`
- Offline support için Service Worker kullanılacak
- Mobile-first tasarım prensibi

---

## 🎯 İlk Sprint (Şimdi Başlıyor)

**Hedef**: Temel altyapıyı kurmak ve ilk çalışan versiyonu oluşturmak

1. ✅ Proje yapısı oluşturma
2. ✅ Database schema
3. ✅ Authentication sistemi
4. ✅ Menü yönetimi
5. ✅ QR kod sistemi
6. ✅ Basit sipariş akışı

**Tahmini Süre**: 2-3 hafta
**Sonuç**: Demo yapılabilir MVP
