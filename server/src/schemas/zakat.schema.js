import { z } from 'zod'
import { JENIS_ZAKAT, METODE_BAYAR } from '../constants/domain.js'

const ZakatItemSchema = z.object({
  jenis_zakat: z.enum(JENIS_ZAKAT, {
    errorMap: () => ({ message: 'Jenis zakat tidak valid' }),
  }),
  nominal: z.coerce
    .number({ invalid_type_error: 'Nominal harus berupa angka' })
    .min(0, 'Nominal tidak boleh negatif')
    .max(999_999_999_999_999, 'Nominal melebihi batas maksimal'),
  berat_kg: z.coerce
    .number({ invalid_type_error: 'Berat harus berupa angka' })
    .min(0, 'Berat tidak boleh negatif')
    .max(9999.999, 'Berat melebihi batas maksimal'),
  jumlah_jiwa: z.coerce
    .number({ invalid_type_error: 'Jumlah jiwa harus berupa angka' })
    .int('Jumlah jiwa harus bilangan bulat')
    .min(1, 'Jumlah jiwa minimal 1')
    .max(99, 'Jumlah jiwa maksimal 99')
    .optional(),
  kembalian_infaq: z.coerce
    .number({ invalid_type_error: 'Kembalian infaq harus berupa angka' })
    .min(0, 'Kembalian infaq tidak boleh negatif')
    .optional(),
})

export const SplitTransaksiSchema = z.object({
  muzakki_id: z.coerce
    .number({ invalid_type_error: 'ID muzakki wajib diisi' })
    .int('ID muzakki harus bilangan bulat')
    .positive('ID muzakki tidak valid'),
  metode_bayar: z.enum(METODE_BAYAR, {
    errorMap: () => ({ message: 'Metode bayar tidak valid' }),
  }),
  no_referensi: z
    .string()
    .trim()
    .min(5, 'Nomor referensi minimal 5 karakter')
    .max(50, 'Nomor referensi maksimal 50 karakter')
    .optional(),
  tahun_hijriah: z.coerce
    .number({ invalid_type_error: 'Tahun hijriah wajib diisi' })
    .int('Tahun hijriah harus bilangan bulat')
    .min(1400, 'Tahun hijriah tidak valid')
    .max(1500, 'Tahun hijriah tidak valid'),
  tahun_masehi: z.coerce
    .number({ invalid_type_error: 'Tahun masehi wajib diisi' })
    .int('Tahun masehi harus bilangan bulat')
    .min(2000, 'Tahun masehi tidak valid')
    .max(2100, 'Tahun masehi tidak valid'),
  items: z.array(ZakatItemSchema).min(1, 'Pilih minimal satu jenis zakat'),
}).refine(
  (data) => !(['transfer', 'qris'].includes(data.metode_bayar)) || !!data.no_referensi,
  {
    message: 'Nomor referensi wajib diisi untuk Transfer/QRIS',
    path: ['no_referensi'],
  }
)

export const ZakatSessionQuerySchema = z.object({
  session_id: z.string().uuid('Session ID tidak valid'),
})
