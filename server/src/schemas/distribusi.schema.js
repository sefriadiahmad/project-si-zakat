import { z } from 'zod'

export const DistribusiKuotaQuerySchema = z.object({
  tahun_hijriah: z.coerce
    .number({ invalid_type_error: 'Tahun hijriah harus berupa angka' })
    .int('Tahun hijriah harus bilangan bulat')
    .min(1400, 'Tahun hijriah tidak valid')
    .max(1500, 'Tahun hijriah tidak valid')
    .optional(),
  tahun_masehi: z.coerce
    .number({ invalid_type_error: 'Tahun masehi harus berupa angka' })
    .int('Tahun masehi harus bilangan bulat')
    .min(2000, 'Tahun masehi tidak valid')
    .max(2100, 'Tahun masehi tidak valid')
    .optional(),
})

export const ZakatKeluarSchema = z.object({
  mustahik_id: z.coerce
    .number({ invalid_type_error: 'ID mustahik wajib diisi' })
    .int('ID mustahik harus bilangan bulat')
    .positive('ID mustahik tidak valid'),
  nominal: z.coerce
    .number({ invalid_type_error: 'Nominal harus berupa angka' })
    .min(0, 'Nominal tidak boleh negatif')
    .optional()
    .default(0),
  berat_kg: z.coerce
    .number({ invalid_type_error: 'Berat harus berupa angka' })
    .min(0, 'Berat tidak boleh negatif')
    .optional()
    .default(0),
  keterangan: z.string().trim().max(500, 'Keterangan maksimal 500 karakter').optional().nullable(),
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
})
