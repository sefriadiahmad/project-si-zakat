import db from '../db.js'
import { LaporanExportQuerySchema } from '../schemas/laporan.schema.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export async function getLaporanExportData(queryParams, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = LaporanExportQuerySchema.parse(queryParams)

  const validJenis = parsed.jenis_zakat === 'semua' ? null : parsed.jenis_zakat

  let baseQuery = connection('zakat_masuk')
    .join('muzakki', 'zakat_masuk.muzakki_id', 'muzakki.id')
    .join('users as kasir', 'zakat_masuk.kasir_id', 'kasir.id')
    .join('wilayah_rt', 'muzakki.wilayah_rt_id', 'wilayah_rt.id')
    .select(
      'zakat_masuk.*',
      'muzakki.nama_lengkap as nama_muzakki',
      'wilayah_rt.nama_rt',
      'kasir.full_name as nama_kasir'
    )

  if (parsed.tahun_hijriah) {
    baseQuery = baseQuery.where('zakat_masuk.tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    baseQuery = baseQuery.where('zakat_masuk.tahun_masehi', parsed.tahun_masehi)
  }
  if (validJenis) {
    baseQuery = baseQuery.where('zakat_masuk.jenis_zakat', validJenis)
  }
  if (parsed.wilayah_rt_id) {
    baseQuery = baseQuery.where('muzakki.wilayah_rt_id', parsed.wilayah_rt_id)
  }

  const data = await baseQuery.orderBy('zakat_masuk.created_at', 'asc').limit(10000)

  return {
    params: parsed,
    data: data || [],
    total: (data || []).length,
  }
}
