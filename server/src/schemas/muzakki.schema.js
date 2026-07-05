import { z } from 'zod'

export const muzakkiSchema = z.object({
  nama_lengkap: z.string().trim().min(1, 'Nama lengkap wajib diisi').max(150, 'Nama lengkap maksimal 150 karakter'),
  no_telepon: z.string().trim().min(1, 'Nomor telepon wajib diisi').max(20, 'Nomor telepon maksimal 20 karakter'),
  wilayah_rt_id: z.number().int().positive('Wilayah RT wajib diisi'),
  alamat_detail: z.string().trim().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
})
