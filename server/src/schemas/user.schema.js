import { z } from 'zod'

export const UserCreateSchema = z.object({
  username: z.string()
    .trim()
    .min(1, 'Username wajib diisi')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  full_name: z.string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(150, 'Nama lengkap maksimal 150 karakter'),
  role: z.enum(['admin_masjid', 'kasir_amil'], {
    errorMap: () => ({ message: 'Role tidak valid' }),
  }),
})
