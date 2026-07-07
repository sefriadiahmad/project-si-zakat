import db from '../db.js'
import { DashboardQuerySchema } from '../schemas/dashboard.schema.js'

export async function getDashboardSummary(queryParams = {}, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = DashboardQuerySchema.parse(queryParams)

  let queryMasuk = connection('zakat_masuk')
  let queryKeluar = connection('zakat_keluar')

  if (parsed.tahun_hijriah) {
    queryMasuk = queryMasuk.where('tahun_hijriah', parsed.tahun_hijriah)
    queryKeluar = queryKeluar.where('tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    queryMasuk = queryMasuk.where('tahun_masehi', parsed.tahun_masehi)
    queryKeluar = queryKeluar.where('tahun_masehi', parsed.tahun_masehi)
  }

  const summary = await queryMasuk
    .sum({
      total_nominal: connection.raw(
        "CASE WHEN jenis_zakat IN ('fitrah_uang','mal','fidyah','infaq') THEN nominal ELSE 0 END"
      ),
      total_beras: connection.raw(
        "CASE WHEN jenis_zakat = 'fitrah_beras' THEN berat_kg ELSE 0 END"
      ),
    })
    .first()

  const muzakkiCount = await connection('muzakki')
    .where('is_active', true)
    .count('id as total_muzakki_aktif')
    .first()

  const mustahikCount = await connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .count('id as total_mustahik_terverifikasi')
    .first()

  const chartMuzakkiRtRows = await connection('muzakki')
    .join('wilayah_rt', 'muzakki.wilayah_rt_id', 'wilayah_rt.id')
    .where('muzakki.is_active', true)
    .groupBy('wilayah_rt.id', 'wilayah_rt.nama_rt')
    .count('muzakki.id as count')
    .select('wilayah_rt.nama_rt', 'count')

  const chartAsnafDonatRows = await connection('zakat_keluar')
    .join('mustahik_asnaf', 'zakat_keluar.mustahik_id', 'mustahik_asnaf.id')
    .groupBy('mustahik_asnaf.kategori_asnaf')
    .sum({
      total_nominal: connection.raw("CASE WHEN nominal IS NOT NULL THEN nominal ELSE 0 END"),
      total_beras: connection.raw("CASE WHEN berat_kg IS NOT NULL THEN berat_kg ELSE 0 END"),
    })
    .select('mustahik_asnaf.kategori_asnaf', 'total_nominal', 'total_beras')

  return {
    total_nominal: Number(summary?.total_nominal || 0),
    total_beras: Number(summary?.total_beras || 0),
    total_muzakki_aktif: Number(muzakkiCount?.total_muzakki_aktif || 0),
    total_mustahik_terverifikasi: Number(mustahikCount?.total_mustahik_terverifikasi || 0),
    chart_muzakki_rt: chartMuzakkiRtRows.map((row) => ({
      nama_rt: row.nama_rt,
      count: Number(row.count),
    })),
    chart_asnaf_donat: chartAsnafDonatRows.map((row) => ({
      kategori_asnaf: row.kategori_asnaf,
      total_nominal: Number(row.total_nominal || 0),
      total_beras: Number(row.total_beras || 0),
    })),
  }
}
