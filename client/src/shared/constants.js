/**
 * Konstanta domain untuk Sistem Informasi Zakat
 */

// Jenis Zakat
export const JENIS_ZAKAT = ['fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq']

// Label display untuk jenis zakat
export const JENIS_ZAKAT_LABELS = {
  fitrah_uang: 'Zakat Fitrah (Uang)',
  fitrah_beras: 'Zakat Fitrah (Beras)',
  mal: 'Zakat Mal',
  fidyah: 'Fidyah',
  infaq: 'Infaq',
}

// Metode Pembayaran
export const METODE_BAYAR = ['tunai', 'transfer', 'qris']

// Label display untuk metode bayar
export const METODE_BAYAR_LABELS = {
  tunai: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
}

// Status Verifikasi Mustahik
export const STATUS_VERIFIKASI = ['menunggu', 'terverifikasi', 'ditolak']

// Label display untuk status verifikasi
export const STATUS_VERIFIKASI_LABELS = {
  menunggu: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
}

// Kategori Asnaf (8 golongan penerima zakat)
export const KATEGORI_ASNAF = [
  'fakir',
  'miskin',
  'amil',
  'mualaf',
  'riqab',
  'gharim',
  'fisabilillah',
  'ibnu_sabil',
]

// Label display untuk kategori asnaf
export const KATEGORI_ASNAF_LABELS = {
  fakir: 'Fakir',
  miskin: 'Miskin',
  amil: 'Amil',
  mualaf: 'Mualaf',
  riqab: 'Riqab',
  gharim: 'Gharim',
  fisabilillah: 'Fisabilillah',
  ibnu_sabil: 'Ibnu Sabil',
}

// Role Pengguna
export const ROLE = ['admin_masjid', 'kasir_amil']

// Label display untuk role
export const ROLE_LABELS = {
  admin_masjid: 'Admin Masjid',
  kasir_amil: 'Kasir Amil',
}

// Konfigurasi kalkulator default
export const KALKULATOR_DEFAULTS = {
  HARGA_BERAS_PER_KG: 15000, // Rp 15.000 per kg
  NISAB_MAL: 85000000, // Rp 85.000.000 (nisab emas ~85 gram x Rp 1.000.000)
  ZAKAT_FITRAH_BERAS_PER_JIWA_KG: 2.5, // 2.5 kg per jiwa
  ZAKAT_MAL_PERSENTASE: 0.025, // 2.5%
}

// Konfigurasi pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
}

// Konfigurasi upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 2,
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png'],
}

// Konfigurasi JWT
export const JWT_CONFIG = {
  TOKEN_EXPIRY_HOURS: 8,
  REFRESH_THRESHOLD_MINUTES: 30,
}

// Konfigurasi rate limiting
export const RATE_LIMIT_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  WINDOW_MS: 60 * 1000, // 1 menit
  BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 menit
}

// Algoritma Keadilan
export const ALGORITMA_KEADILAN = {
  KUOTA_UANG_DESIMAL: 2,
  KUOTA_BERAS_DESIMAL: 3,
  MIN_TANGGUNGAN: 1,
  MAX_TANGGUNGAN: 99,
}
