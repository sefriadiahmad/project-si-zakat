import { z } from 'zod'
import { KATEGORI_ASNAF, STATUS_VERIFIKASI } from '../constants/domain.js'

export const mustahikCreateSchema = z.object({
  nama_kepala_keluarga: z
    .string()
    .trim()
    .min(1, 'Nama kepala keluarga wajib diisi')
    .max(150, 'Nama kepala keluarga maksimal 150 karakter'),
  wilayah_rt_id: z.coerce
    .number({ invalid_type_error: 'Wilayah RT wajib diisi' })
    .int()
    .positive('Wilayah RT wajib diisi'),
  kategori_asnaf: z.enum(KATEGORI_ASNAF, {
    errorMap: () => ({ message: 'Kategori asnaf tidak valid' }),
  }),
  jumlah_tanggungan: z.coerce
    .number({ invalid_type_error: 'Jumlah tanggungan wajib diisi' })
    .int()
    .min(1, 'Jumlah tanggungan minimal 1')
    .max(99, 'Jumlah tanggungan maksimal 99'),
  dokumen_url: z.string().trim().optional().nullable(),
})

export const mustahikVerifikasiSchema = z
  .object({
    status_verifikasi: z.enum(['terverifikasi', 'ditolak'], {
      errorMap: () => ({ message: 'Status verifikasi tidak valid' }),
    }),
    alasan_penolakan: z
      .string()
      .trim()
      .min(1, 'Alasan penolakan wajib diisi')
      .max(500, 'Alasan penolakan maksimal 500 karakter')
      .optional(),
  })
  .refine(
    (data) => data.status_verifikasi !== 'ditolak' || !!data.alasan_penolakan,
    {
      message: 'Alasan penolakan wajib diisi saat menolak mustahik',
      path: ['alasan_penolakan'],
    }
  )

export const mustahikListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status_verifikasi: z.enum(STATUS_VERIFIKASI).optional(),
  kategori_asnaf: z.enum(KATEGORI_ASNAF).optional(),
  wilayah_rt_id: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})
