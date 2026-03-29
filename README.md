# ⚡ ElektroKasir POS (Desktop Edition)

Sistem Point of Sale berbasis *Desktop* (C# WebView2) dengan *backend* Node.js untuk toko elektronik skala kecil hingga menengah. Dirancang khusus untuk berjalan secara mandiri (*offline*) tanpa memerlukan koneksi internet atau *server* eksternal.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite%20%2B%20C%23-informational)

---

## 🗂 Struktur Proyek

```
elektrokasir/
├── backend/                 # API Server (Express + Prisma + SQLite)
│   ├── prisma/
│   │   ├── schema.prisma    # Skema Database
│   │   └── dev.db           # File Database Utama Lokal 
│   ├── src/                 # Logika Bisnis (Produk, Transaksi, Kasir)
│   └── update_users.js      # Skrip utilitas manajemen akun
├── frontend/                # Antarmuka Pengguna (React + Vite + Tailwind)
│   ├── src/                 # Kode sumber UI
│   └── dist/                # Hasil build (*Production Ready*)
└── DesktopApp/              # Program Cangkang C# Windows (WebView2)
    └── Release/             # Folder berisikan file .exe akhir
```

---

## 🚀 Cara Menjalankan & Instalasi Lokal

Karena ini adalah sistem mandiri berbasi SQLite, Anda **tidak perlu** menginstal server *database* seperti MySQL atau PostgreSQL.

### Persiapan Syarat (Prerequisites)
Pastikan komputer utama penyimpan data (Komputer Kasir) telah menginstal **Node.js LTS** untuk Windows.

### Menjalankan Lewat Aplikasi Windows (.exe)
Folder proyek telah dilengkapi dengan berkas C# (*Executable*).
1. Buka folder `Release` atau gunakan _shortcut_ yang sudah disediakan.
2. Klik 2x pada file `ElektroKasirDesktop.exe`.
3. Aplikasi akan otomatis menjalankan *backend* di latar belakang dan memuat antarmuka kasir dalam mode layar penuh berbasis *Edge WebView*.

### Menjalankan Secara Manual via Terminal (Untuk Modifikasi/Developer)
**1. Menyalakan API & Database (Backend)**
```bash
cd backend
npm install
npx prisma generate
node src/index.js
# API Server akan berjalan otomatis di latar belakang
```

**2. Membangun / Menjalankan UI (Frontend)**
```bash
cd frontend
npm install
# Untuk merevisi dan melihat perubahan langsung:
npm run dev

# Untuk menyatukan / mem-build ke versi akhir (production):
npm run build
```

---

## 🔑 Autentikasi & Akun
*(Perhatian: Demi keamanan, kata sandi bawaan tidak dicantumkan secara publik di dokumen ini.)*

Aplikasi kasir ini menggunakan sistem autentikasi mandiri lintas-jaringan (*Local Network*):
1. **Sistem ID Pengguna**: Semua kasir dan admin masuk menggunakan ID (misal: `admin`, `kasir`), bukan lagi melalui pengetikan *email* panjang demi kecepatan antrean.
2. Keamanan sandi di-hash menggunakan **bcrypt**.
3. Hubungi manajer operasional IT toko untuk mendapatkan ID dan Sandi bawaan (*Default Password*). Admin memiliki hak penuh untuk membuatkan/mengubah akun kasir melalui laman "Pengguna" di menu utama.

---

## 🔒 Privasi dan Mode Jaringan Lokal (Offline LAN)

Aplikasi dirancang anti-bocor:
- **Offline First**: Semua transaksi dan perhitungan disimpan fisikal murni ke dalam hardisk komputer kasir (di dalam file `dev.db`).
- **Akses LAN Multi-Kasir**: Meskipun tidak terhubung internet global, Anda tetap bisa menyambungkan *Tablet/iPad* sebagai perangkat mesin cetak struk ekstra, asalkan perangkat tersebut **tersambung ke jaringan WiFi ruang toko yang sama**, dengan mengakses alamat IP komputer utama (Contoh: `http://192.168.1.5:5000`).
- **Rate Limit**: Batasan permintaan login dimatikan untuk menjamin kelancaran *multi-device* dalam jaringan aman.

---

## 🛠 Teknologi Utama

| Lingkup   | Teknologi Pendukung                  |
|-----------|--------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS         |
| Backend   | Node.js, Express, Prisma ORM         |
| Database  | **SQLite** (Standalone Desktop App)  |
| Desktop   | C# Windows Forms (.NET) + WebView2   |

---

## 📝 Lisensi
MIT — Bebas digunakan dan dimodifikasi untuk kebutuhan komersial internal.
