import { z } from 'zod'

/**
 * Query params schema for demografi endpoints
 * Requirements: 10.5
 */
export const DemografiQuerySchema = z.object({
  tahun_hijriah: z.string()
    .regex(/^\d{4}$/, 'Tahun hijriah harus 4 digit')
    .optional(),
  tahun_masehi: z.string()
    .regex(/^\d{4}$/, 'Tahun masehi harus 4 digit')
    .optional(),
}).optional()

/**
 * Query params schema for RT detail endpoint
 * Requirements: 10.6
 */
export const DemografiRTDetailQuerySchema = z.object({
  tahun_hijriah: z.string()
    .regex(/^\d{4}$/, 'Tahun hijriah harus 4 digit')
    .optional(),
  tahun_masehi: z.string()
    .regex(/^\d{4}$/, 'Tahun masehi harus 4 digit')
    .optional(),
})

/**
 * Body schema for creating wilayah RT
 */
export const CreateWilayahRTSchema = z.object({
  nama_rt: z.string()
    .min(1, 'Nama RT tidak boleh kosong')
    .max(50, 'Nama RT maksimal 50 karakter'),
  keterangan: z.string()
    .max(500, 'Keterangan maksimal 500 karakter')
    .optional(),
})
