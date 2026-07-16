# Sistem Informasi Zakat

Aplikasi web fullstack untuk pengelolaan zakat, infaq, dan sedekah di lingkungan masjid dengan zonasi RT. Sistem mendukung dua peran pengguna (Admin Masjid dan Kasir Amil), registrasi muzakki, manajemen mustahik/asnaf, transaksi multi-jenis zakat, distribusi berbasis algoritma keadilan, pelaporan keuangan formal multi-periode, serta halaman publik untuk transparansi dan kalkulator zakat mandiri.

---

## Fitur Utama

### 1. Autentikasi Multi-Peran
- Login dengan username dan password
- Dua peran pengguna: Admin Masjid (akses penuh) dan Kasir Amil (akses operasional terbatas)
- JWT dengan masa berlaku 8 jam dan auto-refresh dalam 30 menit terakhir
- Rate limiting: 5 percobaan gagal per IP per menit

### 2. Manajemen Muzakki
- Registrasi muzakki dengan data lengkap (nama, telepon, RT)
- Validasi nomor telepon unik
- Pencarian dan pengurutan data
- Aktivasi/nonaktivasi muzakki tanpa menghapus data historis

### 3. Manajemen Mustahik dan Asnaf
- Pendaftaran mustahik dengan 8 kategori asnaf (Fakir, Miskin, Amil, Mualaf, Riqab, Gharim, Fisabilillah, Ibnu Sabil)
- Sistem verifikasi: Menunggu, Terverifikasi, Ditolak
- Alasan penolakan wajib untuk mustahik yang ditolak
- Upload dokumen pendukung (PDF, JPG, PNG maks 2MB)

### 4. Split-Transaction Funnel
- Pencatatan multi-jenis zakat dalam satu sesi:
  - Zakat Fitrah (Uang dan Beras)
  - Zakat Mal
  - Fidyah
  - Infaq dengan toggle kembalian
- Tiga metode pembayaran: Tunai, Transfer, QRIS
- Validasi nomor referensi untuk Transfer/QRIS
- ACID transaction untuk konsistensi data

### 5. Cetak Bukti Setor
- PDF A4 untuk laporan formal
- Struk Thermal 80mm untuk cetakan kasir
- Timestamp dan jenis output tercatat di sistem
- Support printer ESC-POS (jika terdeteksi)

### 6. Dashboard Real-Time
- Kartu ringkasan: Total dana, beras, muzakki, mustahik
- Grafik batang: Muzakki per RT
- Grafik donat: Proporsi distribusi per asnaf
- Auto-refresh setiap 5 detik
- Filter periode (Tahun Hijriah/Masehi)

### 7. Algoritma Keadilan Distribusi
- Kuota Uang per Jiwa = Sigma(Nominal Fitrah+Fidyah+Mal) / Sigma(Tanggungan Mustahik Terverifikasi)
- Kuota Beras per Jiwa = Sigma(Berat Beras) / Sigma(Tanggungan Mustahik Terverifikasi)
- Rekomendasi distribusi per mustahik
- Update real-time setelah perubahan data

### 8. Ekspor Laporan Keuangan
- Filter multi-dimensi: Periode, Jenis Zakat, Wilayah RT
- Format output: PDF A4 dan XLSX
- Maksimum rentang 5 tahun per ekspor
- Header masjid, ringkasan pemasukan/pengeluaran, saldo akhir, penanda laporan

### 9. Landing Page Publik
- Akses tanpa login
- Transparansi kas: Total dana dan beras terkumpul
- Grafik batang: Perbandingan Muzakki/Mustahik per RT
- Grafik donat: Proporsi distribusi per asnaf
- Kalkulator Zakat Mandiri:
  - Zakat Fitrah Uang (J x 2.5 x Harga Beras)
  - Zakat Fitrah Beras (J x 2.5 kg)
  - Zakat Mal (2.5% x (Harta - Nisab))
- Tidak menampilkan data pribadi (PII-free)

### 10. Pemetaan Demografi per RT
- Ringkasan per RT: Muzakki aktif, Mustahik terverifikasi, Dana masuk/keluar
- Tabel dapat diurutkan
- Rasio Muzakki/Mustahik per RT
- Filter periode (Tahun Hijriah/Masehi)
- Detail per asnaf

### 11. Keamanan dan Audit
- Parameterized queries (SQL injection prevention)
- bcrypt cost factor 12 untuk password
- Audit log untuk setiap mutasi (CREATE, UPDATE, DELETE)
- Validasi input ketat dengan Zod
- HTTPS di lingkungan produksi

---

## Struktur Folder

```
project-zakat/
|-- client/                   # Frontend (React + Vite)
|   |-- src/
|       |-- app/              # Konfigurasi app (routes, providers)
|       |-- features/         # Modul fitur per domain
|       |   |-- demografi/    # Halaman demografi
|       |   |-- distribusi/   # Halaman distribusi
|       |   |-- landing/      # Landing page publik
|       |   |-- laporan/      # Halaman laporan
|       |   |-- login/        # Halaman login
|       |   |-- muzakki/      # Manajemen muzakki
|       |   |-- mustahik/     # Manajemen mustahik
|       |   |-- verifikasi/    # Verifikasi mustahik
|       |   |-- dashboard/    # Dashboard
|       |   |-- transaksi/    # Transaksi zakat masuk
|       |   |-- profile/      # Profil pengguna
|       |-- shared/           # Komponen dan utilitas bersama
|           |-- components/   # Komponen UI (Card, Button, dll)
|           |-- lib/         # Axios, utils
|           |-- hooks/        # Custom hooks
|       |-- main.jsx          # Entry point
|       |-- index.css         # Global styles (Tailwind)
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- .env.example
|
|-- server/                   # Backend (Node.js + Express)
|   |-- src/
|       |-- constants/        # Konstanta aplikasi
|       |-- db.js            # Koneksi database Knex
|       |-- index.js         # Entry point Express
|       |-- lib/             # Library utilitas
|       |-- middleware/      # Express middlewares
|       |   |-- auth.js      # Autentikasi JWT
|       |   |-- authorize.js # Otorisasi role
|       |-- routes/          # Express routes
|       |   |-- auth.routes.js
|       |   |-- demografi.routes.js
|       |   |-- distribusi.routes.js
|       |   |-- laporan.routes.js
|       |   |-- mustahik.routes.js
|       |   |-- muzakki.routes.js
|       |   |-- publik.routes.js
|       |   |-- zakat.routes.js
|       |-- schemas/         # Zod validation schemas
|       |-- services/        # Business logic
|       |-- utils/           # Utility functions
|       |-- tests/          # Unit dan property tests
|   |-- migrations/         # Knex migrations
|   |-- seeds/             # Seed data awal
|   |-- package.json
|   |-- knexfile.js
|   |-- .env.example
|
|-- README.md               # Dokumentasi utama
```

---

## Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.x | Library UI |
| Vite | 8.x | Build tool dan dev server |
| React Router DOM | 7.x | Routing |
| React Query | 5.x | Server state management |
| React Hook Form | 7.x | Form handling |
| Zod | 4.x | Schema validation (client) |
| Tailwind CSS | 4.x | Styling |
| Shadcn UI (Radix) | - | Komponen UI |
| Recharts | 3.x | Visualisasi data (chart) |
| jsPDF | 4.x | Generate PDF |
| jsPDF-AutoTable | 5.x | Tabel dalam PDF |
| Axios | 1.x | HTTP client |
| Lucide React | 1.x | Icon library |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | 22.x | Runtime |
| Express | 4.x | Web framework |
| Knex.js | 3.x | Query builder |
| PostgreSQL | 15+ | Database |
| JWT | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| Zod | 3.x | Schema validation |
| express-rate-limit | 7.x | Rate limiting |
| Helmet | 8.x | Security headers |
| CORS | 2.x | Cross-origin resource sharing |
| Multer | 2.x | File upload |
| UUID | 10.x | Unique identifier |
| jsPDF + AutoTable | 2.x | PDF generation (server) |
| SheetJS (xlsx) | 0.18.x | Excel export |
| Compression | 1.x | Response compression |

### Development & Testing
| Teknologi | Fungsi |
|-----------|--------|
| Jest | Testing framework |
| fast-check | Property-based testing |
| Supertest | HTTP integration testing |
| ESLint | Linting (frontend) |
| Oxlint | Linting (frontend) |

---

## Cara Instalasi dan Menjalankan

### Prasyarat
- Node.js 18.x atau lebih tinggi
- PostgreSQL 15 atau lebih tinggi
- npm atau yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd project-zakat
```

### 2. Setup Database

#### Buat Database PostgreSQL
```sql
CREATE DATABASE sistem_zakat;
```

#### Setup Server
```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env dan sesuaikan konfigurasi database

# Jalankan migrasi
npm run migrate

# (Opsional) Seed data awal
npm run seed

# Start development server
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### 3. Setup Client
```bash
cd client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env untuk API URL jika perlu

# Start development server
npm run dev
```

Client akan berjalan di `http://localhost:5173`

### 4. Login Default
Setelah seed data dijalankan, gunakan kredensial berikut:

| Peran | Username | Password |
|-------|---------|----------|
| Admin Masjid | admin_masjid | admin123 |

### Variabel Lingkungan

#### Server (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistem_zakat
DB_USER=postgres
DB_PASSWORD=your_password 

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h

# Masjid
NAMA_MASJID="Masjid Al-Ikhlas"
ALAMAT_MASJID="Jl. Masjid Raya No. 1"
HARGA_BERAS_DEFAULT=15000
NISAB_MAL_DEFAULT=85000000
```

#### Client (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Scripts yang Tersedia

#### Server
```bash
npm run dev          # Start development server (with watch mode)
npm start           # Start production server
npm run migrate      # Run database migrations
npm run migrate:rollback  # Rollback last migration
npm run seed         # Run seed data
npm test           # Run tests
```

#### Client
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
```

---

## API Endpoints

### Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login pengguna |
| POST | /api/auth/logout | Logout pengguna |
| POST | /api/auth/refresh | Refresh token |

### Muzakki
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/muzakki | Daftar muzakki (filterable, sortable) |
| POST | /api/muzakki | Tambah muzakki baru |
| PUT | /api/muzakki/:id | Update data muzakki |
| PATCH | /api/muzakki/:id/status | Toggle status aktif |

### Mustahik
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/mustahik | Daftar mustahik (filterable) |
| POST | /api/mustahik | Daftar mustahik baru |
| PATCH | /api/mustahik/:id/verifikasi | Verifikasi mustahik |

### Zakat
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/zakat/masuk | Simpan transaksi masuk |
| GET | /api/zakat/masuk/:sessionId | Detail transaksi |

### Distribusi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/distribusi/kuota | Get kuota distribusi |
| GET | /api/distribusi/rekomendasi | Get rekomendasi per mustahik |
| POST | /api/zakat/keluar | Catat distribusi keluar |

### Laporan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/laporan/export | Ekspor laporan (PDF/XLSX) |

### Dashboard
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/dashboard/summary | Ringkasan data dashboard |

### Demografi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/demografi | Ringkasan demografi per RT |
| GET | /api/demografi/:rtId | Detail demografi per RT |

### Publik
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/publik/summary | Data publik (tanpa PII) |
| GET | /api/publik/kalkulator-config | Konfigurasi kalkulator |

---

## Lisensi

ISC
