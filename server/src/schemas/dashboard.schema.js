import { z } from 'zod'

export const DashboardQuerySchema = z.object({
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
