import db from '../db.js'
import { PublikSummaryQuerySchema } from '../schemas/publik.schema.js'

export async function getPublikSummary(queryParams = {}, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = PublikSummaryQuerySchema.parse(queryParams)

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

  const chartMuzakkiRt = await connection('muzakki')
    .join('wilayah_rt', 'muzakki.wilayah_rt_id', 'wilayah_rt.id')
    .where('muzakki.is_active', true)
    .groupBy('wilayah_rt.id', 'wilayah_rt.nama_rt')
    .count('muzakki.id as count')
    .select('wilayah_rt.nama_rt', 'count')

  const chartAsnafDonat = await queryKeluar
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
    chart_muzakki_rt: Array.isArray(chartMuzakkiRt) ? chartMuzakkiRt.map((row) => ({
      nama_rt: row.nama_rt,
      count: Number(row.count),
    })) : [],
    chart_asnaf_donat: Array.isArray(chartAsnafDonat) ? chartAsnafDonat.map((row) => ({
      kategori_asnaf: row.kategori_asnaf,
      total_nominal: Number(row.total_nominal || 0),
      total_beras: Number(row.total_beras || 0),
    })) : [],
  }
}

export async function getKalkulatorConfig(dependencies = {}) {
  const connection = dependencies.db || db

  try {
    const config = await connection('kalkulator_config')
      .where('is_active', true)
      .orderBy('updated_at', 'desc')
      .first()

    if (!config) {
      return {
        harga_beras_per_kg: Number(process.env.HARGA_BERAS_PER_KG || 12000),
        nilai_nisab: Number(process.env.NILAI_NISAB || 5240000),
      }
    }

    return {
      harga_beras_per_kg: Number(config.harga_beras_per_kg || process.env.HARGA_BERAS_PER_KG || 12000),
      nilai_nisab: Number(config.nilai_nisab || process.env.NILAI_NISAB || 5240000),
    }
  } catch (error) {
    return {
      harga_beras_per_kg: Number(process.env.HARGA_BERAS_PER_KG || 12000),
      nilai_nisab: Number(process.env.NILAI_NISAB || 5240000),
    }
  }
}
