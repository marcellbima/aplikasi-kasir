# ⚡ ElektroKasir POS

Sistem Point of Sale berbasis web untuk toko elektronik skala kecil hingga menengah.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20PostgreSQL-informational)

---

## 🗂 Struktur Proyek

```
elektrokasir/
├── backend/                 # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Data awal (users, produk, kategori)
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, error handler
│   │   ├── routes/          # API routes
│   │   └── utils/           # JWT, response helpers
│   └── .env.example
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/           # LoginPage, POSPage, DashboardPage, dst.
│   │   ├── components/      # Layout, ReceiptModal
│   │   ├── store/           # Zustand (auth, cart)
│   │   └── utils/           # API client, formatter
│   └── nginx.conf
└── docker-compose.yml
```

---

## 🚀 Cara Menjalankan

### A) Dengan Docker Compose (Rekomendasi)

```bash
# Clone & masuk ke folder
cd elektrokasir

# Jalankan semua service
docker compose up --build -d

# Cek logs
docker compose logs -f backend
```

Akses: **http://localhost:5173**

### B) Manual (Development)

**1. Setup PostgreSQL**
```bash
# Buat database
createdb elektrokasir
```

**2. Backend**
```bash
cd backend
cp .env.example .env
# Edit .env — isi DATABASE_URL, JWT_SECRET, dll.

npm install
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
npm run dev
# API berjalan di http://localhost:5000
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
# App berjalan di http://localhost:5173
```

---

## 🔑 Akun Demo

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@elektrokasir.com       | admin123   |
| Kasir | kasir@elektrokasir.com       | kasir123   |

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/login          Login & dapatkan token
POST   /api/auth/refresh        Refresh access token
POST   /api/auth/logout         Logout
GET    /api/auth/me             Info user aktif
```

### Products
```
GET    /api/products                   List produk (search, filter, pagination)
GET    /api/products/barcode/:barcode  Cari by barcode (untuk scan)
GET    /api/products/:id               Detail produk + stock logs
POST   /api/products                   Tambah produk [ADMIN]
PUT    /api/products/:id               Edit produk [ADMIN]
PATCH  /api/products/:id/stock         Adjust stok [ADMIN]
DELETE /api/products/:id               Hapus (soft delete) [ADMIN]
```

### Categories
```
GET    /api/categories          List semua kategori
POST   /api/categories          Buat kategori [ADMIN]
PUT    /api/categories/:id      Edit kategori [ADMIN]
DELETE /api/categories/:id      Hapus kategori [ADMIN]
```

### Transactions
```
GET    /api/transactions        List transaksi (filter tanggal, pagination)
GET    /api/transactions/:id    Detail transaksi + items
POST   /api/transactions        Buat transaksi baru (checkout)
```

### Dashboard (ADMIN)
```
GET    /api/dashboard           KPI hari ini + stok menipis + top produk + chart mingguan
```

### Users (ADMIN)
```
GET    /api/users               List semua user
POST   /api/users               Tambah user
PUT    /api/users/:id           Edit user
```

---

## 🗄 Database Schema

```
Users           → id, name, email, password, role (ADMIN/KASIR), isActive
Categories      → id, name, slug
Products        → id, name, sku, barcode, categoryId, price, costPrice, stock, minStock, rackLocation
Transactions    → id, invoiceNumber, userId, subtotal, discountAmount, total, paymentMethod, amountPaid, changeAmount, status
TransactionItems→ id, transactionId, productId, productName, quantity, unitPrice, discountPct, subtotal
StockLogs       → id, productId, change, reason, stockBefore, stockAfter
RefreshTokens   → id, token, userId, expiresAt
```

---

## 🔒 Keamanan

- Password di-hash dengan bcrypt (cost factor 12)
- JWT access token (15 menit) + refresh token (7 hari)
- Role-based access control (ADMIN / KASIR)
- Rate limiting: 200 req/15min global, 10 req/15min untuk login
- Helmet.js untuk HTTP security headers
- Input validation dengan express-validator

---

## 🛠 Tech Stack

| Layer     | Teknologi                            |
|-----------|--------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Zustand|
| Backend   | Node.js, Express, Prisma ORM         |
| Database  | PostgreSQL                           |
| Auth      | JWT (access + refresh token)         |
| Deploy    | Docker, Docker Compose, Nginx        |

---

## 🗺 Roadmap v1.1

- [ ] Export laporan ke Excel/PDF
- [ ] Barcode generator & print label
- [ ] Manajemen supplier & purchase order
- [ ] Multi-outlet support
- [ ] PWA (offline mode)
- [ ] Notifikasi WhatsApp untuk stok menipis

---

## 📝 Lisensi

MIT — bebas digunakan untuk kebutuhan komersial.
