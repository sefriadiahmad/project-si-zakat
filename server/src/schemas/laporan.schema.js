import { z } from 'zod'

export const LaporanExportQuerySchema = z.object({
  format: z.enum(['pdf', 'xlsx'], {
    errorMap: () => ({ message: 'Format export tidak valid. Pilih pdf atau xlsx.' }),
  }),
  tahun_hijriah: z.coerce
    .number({ invalid_type_error: 'Tahun hijriah harus berupa angka' })
    .int('Tahun hijriah harus bilangan bulat')
    .min(1400, 'Tahun hijriah tidak valid')
    .max(1500, 'Tahun hijriah tidak valid')
    .optional()
    .nullable(),
  tahun_masehi: z.coerce
    .number({ invalid_type_error: 'Tahun masehi harus berupa angka' })
    .int('Tahun masehi harus bilangan bulat')
    .min(2000, 'Tahun masehi tidak valid')
    .max(2100, 'Tahun masehi tidak valid')
    .optional()
    .nullable(),
  jenis_zakat: z.enum(['fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq', 'semua'], {
    errorMap: () => ({ message: 'Jenis zakat tidak valid' }),
  }).default('semua'),
  wilayah_rt_id: z.coerce.number().int().positive().optional(),
})
