import db from '../db.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

/**
 * Build period filter query builder
 * @param {Object} query - Knex query builder
 * @param {string} tahunHijriah - Optional tahun hijriah filter
 * @param {string} tahunMasehi - Optional tahun masehi filter
 * @returns {Object} Modified query builder
 */
function buildPeriodFilter(query, tahunHijriah, tahunMasehi) {
  if (tahunHijriah) {
    query.where('tahun_hijriah', parseInt(tahunHijriah, 10))
  }
  if (tahunMasehi) {
    query.where('tahun_masehi', parseInt(tahunMasehi, 10))
  }
  return query
}

/**
 * Get demografi summary for all RTs
 * Aggregasi per RT: jumlah muzakki aktif, mustahik terverifikasi,
 * total dana masuk, total distribusi keluar, rasio muzakki/mustahik
 *
 * Requirements: 10.1, 10.2, 10.4, 10.5
 * @param {Object} queryParams - Query parameters with optional tahun filters
 * @returns {Promise<Array>} Array of RT demografi summaries
 */
export async function getDemografiSummary(queryParams = {}, dependencies = {}) {
  const connection = dependencies.db || db
  const { tahun_hijriah, tahun_masehi } = queryParams

  // Get all wilayah RT
  const wilayahRt = await connection('wilayah_rt')
    .select('id', 'nama_rt', 'keterangan')
    .orderBy('nama_rt', 'asc')

  // Get muzakki counts per RT (active only)
  const muzakkiCounts = await connection('muzakki')
    .where('is_active', true)
    .select('wilayah_rt_id')
    .count('id as jumlah_muzakki')
    .groupBy('wilayah_rt_id')

  // Create lookup map for muzakki counts
  const muzakkiMap = new Map(
    muzakkiCounts.map((m) => [m.wilayah_rt_id, Number(m.jumlah_muzakki)])
  )

  // Get mustahik category breakdown per RT (verified only)
  const mustahikByAsnafQuery = connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .select('wilayah_rt_id', 'kategori_asnaf')
    .count('id as jumlah_keluarga')
    .sum('jumlah_tanggungan as total_tanggungan')
    .groupBy('wilayah_rt_id', 'kategori_asnaf')

  const mustahikByAsnafData = await mustahikByAsnafQuery

  // Create nested map: rtId -> { kategori_asnaf -> { jumlah, tanggungan } }
  const mustahikAsnafMap = new Map()
  mustahikByAsnafData.forEach((m) => {
    if (!mustahikAsnafMap.has(m.wilayah_rt_id)) {
      mustahikAsnafMap.set(m.wilayah_rt_id, new Map())
    }
    mustahikAsnafMap.get(m.wilayah_rt_id).set(m.kategori_asnaf, {
      jumlah_keluarga: Number(m.jumlah_keluarga),
      total_tanggungan: Number(m.total_tanggungan || 0),
    })
  })

  // Get all unique asnaf categories for chart reference
  const allAsnafCategories = [...new Set(mustahikByAsnafData.map((m) => m.kategori_asnaf))]

  // Get mustahik counts per RT (verified only)
  const mustahikCounts = await connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .select('wilayah_rt_id')
    .count('id as jumlah_mustahik')
    .sum('jumlah_tanggungan as total_tanggungan')
    .groupBy('wilayah_rt_id')

  // Create lookup map for mustahik counts
  const mustahikMap = new Map(
    mustahikCounts.map((m) => [
      m.wilayah_rt_id,
      {
        jumlah_mustahik: Number(m.jumlah_mustahik),
        total_tanggungan: Number(m.total_tanggungan || 0),
      },
    ])
  )

  // Get total dana masuk per RT
  const zakatMasukQuery = connection('zakat_masuk')
    .select('muzakki.wilayah_rt_id')
    .sum({ total_dana_masuk: 'zakat_masuk.nominal' })
    .sum({ total_beras_masuk: 'zakat_masuk.berat_kg' })
    .join('muzakki', 'zakat_masuk.muzakki_id', 'muzakki.id')
    .groupBy('muzakki.wilayah_rt_id')

  buildPeriodFilter(zakatMasukQuery, tahun_hijriah, tahun_masehi)

  const zakatMasukData = await zakatMasukQuery

  const zakatMasukMap = new Map(
    zakatMasukData.map((z) => [
      z.wilayah_rt_id,
      {
        total_dana_masuk: Number(z.total_dana_masuk || 0),
        total_beras_masuk: Number(z.total_beras_masuk || 0),
      },
    ])
  )

  // Get total distribusi keluar per RT
  const zakatKeluarQuery = connection('zakat_keluar')
    .select('mustahik_asnaf.wilayah_rt_id')
    .sum({ total_dana_keluar: 'zakat_keluar.nominal' })
    .sum({ total_beras_keluar: 'zakat_keluar.berat_kg' })
    .join('mustahik_asnaf', 'zakat_keluar.mustahik_id', 'mustahik_asnaf.id')
    .groupBy('mustahik_asnaf.wilayah_rt_id')

  buildPeriodFilter(zakatKeluarQuery, tahun_hijriah, tahun_masehi)

  const zakatKeluarData = await zakatKeluarQuery

  const zakatKeluarMap = new Map(
    zakatKeluarData.map((z) => [
      z.wilayah_rt_id,
      {
        total_dana_keluar: Number(z.total_dana_keluar || 0),
        total_beras_keluar: Number(z.total_beras_keluar || 0),
      },
    ])
  )

  // Build result array
  const result = wilayahRt.map((rt) => {
    const muzakkiCount = muzakkiMap.get(rt.id) || 0
    const mustahikData = mustahikMap.get(rt.id) || { jumlah_mustahik: 0, total_tanggungan: 0 }
    const zakatMasuk = zakatMasukMap.get(rt.id) || { total_dana_masuk: 0, total_beras_masuk: 0 }
    const zakatKeluar = zakatKeluarMap.get(rt.id) || { total_dana_keluar: 0, total_beras_keluar: 0 }
    const asnafData = mustahikAsnafMap.get(rt.id) || new Map()

    // Convert asnaf map to array for JSON
    const mustahik_per_asnaf = Array.from(asnafData.entries()).map(([kategori, data]) => ({
      kategori_asnaf: kategori,
      jumlah_keluarga: data.jumlah_keluarga,
      total_tanggungan: data.total_tanggungan,
    }))

    // Calculate ratio: muzakki/mustahik, return "N/A" if mustahik is 0
    const rasio = mustahikData.jumlah_mustahik > 0
      ? Number((muzakkiCount / mustahikData.jumlah_mustahik).toFixed(2))
      : 'N/A'

    return {
      rt_id: rt.id,
      nama_rt: rt.nama_rt,
      keterangan: rt.keterangan || null,
      jumlah_muzakki_aktif: muzakkiCount,
      jumlah_mustahik_terverifikasi: mustahikData.jumlah_mustahik,
      total_tanggungan: mustahikData.total_tanggungan,
      total_dana_masuk: zakatMasuk.total_dana_masuk,
      total_beras_masuk: zakatMasuk.total_beras_masuk,
      total_dana_keluar: zakatKeluar.total_dana_keluar,
      total_beras_keluar: zakatKeluar.total_beras_keluar,
      rasio_muzakki_mustahik: rasio,
      mustahik_per_asnaf: mustahik_per_asnaf,
    }
  })

  return { wilayah: result, asnaf_categories: allAsnafCategories }
}

/**
 * Get demografi detail for a specific RT
 * Requirements: 10.3, 10.5, 10.6
 * @param {number} rtId - Wilayah RT ID
 * @param {Object} queryParams - Query parameters with optional tahun filters
 * @returns {Promise<Object>} RT detail demografi
 */
export async function getDemografiRTDetail(rtId, queryParams = {}, dependencies = {}) {
  const connection = dependencies.db || db
  const { tahun_hijriah, tahun_masehi } = queryParams

  // Get RT info
  const rt = await connection('wilayah_rt')
    .where('id', rtId)
    .first()

  if (!rt) {
    throw new AppError('Wilayah RT tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  // Get muzakki count (active only, no PII)
  const [muzakkiStats] = await connection('muzakki')
    .where('wilayah_rt_id', rtId)
    .where('is_active', true)
    .select(
      connection.raw('COUNT(*) as jumlah_muzakki'),
      connection.raw('SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as muzakki_aktif')
    )

  // Get mustahik breakdown by asnaf category (verified only, no PII)
  const mustahikByAsnaf = await connection('mustahik_asnaf')
    .where('wilayah_rt_id', rtId)
    .where('status_verifikasi', 'terverifikasi')
    .select('kategori_asnaf')
    .count('id as jumlah_keluarga')
    .sum('jumlah_tanggungan as total_tanggungan')
    .groupBy('kategori_asnaf')

  // Format asnaf breakdown
  const asnafBreakdown = mustahikByAsnaf.map((a) => ({
    kategori_asnaf: a.kategori_asnaf,
    jumlah_keluarga: Number(a.jumlah_keluarga),
    total_tanggungan: Number(a.total_tanggungan || 0),
  }))

  // Calculate totals for mustahik
  const totalMustahikKeluarga = asnafBreakdown.reduce(
    (sum, a) => sum + a.jumlah_keluarga,
    0
  )
  const totalMustahikTanggungan = asnafBreakdown.reduce(
    (sum, a) => sum + a.total_tanggungan,
    0
  )

  // Get total dana masuk for this RT
  const zakatMasukQuery = connection('zakat_masuk')
    .select(
      connection.raw('COALESCE(SUM(zakat_masuk.nominal), 0) as total_dana_masuk'),
      connection.raw('COALESCE(SUM(zakat_masuk.berat_kg), 0) as total_beras_masuk'),
      connection.raw('COUNT(*) as jumlah_transaksi')
    )
    .join('muzakki', 'zakat_masuk.muzakki_id', 'muzakki.id')
    .where('muzakki.wilayah_rt_id', rtId)

  buildPeriodFilter(zakatMasukQuery, tahun_hijriah, tahun_masehi)

  const [zakatMasuk] = await zakatMasukQuery

  // Get total distribusi keluar for this RT
  const zakatKeluarQuery = connection('zakat_keluar')
    .select(
      connection.raw('COALESCE(SUM(zakat_keluar.nominal), 0) as total_dana_keluar'),
      connection.raw('COALESCE(SUM(zakat_keluar.berat_kg), 0) as total_beras_keluar'),
      connection.raw('COUNT(*) as jumlah_distribusi')
    )
    .join('mustahik_asnaf', 'zakat_keluar.mustahik_id', 'mustahik_asnaf.id')
    .where('mustahik_asnaf.wilayah_rt_id', rtId)

  buildPeriodFilter(zakatKeluarQuery, tahun_hijriah, tahun_masehi)

  const [zakatKeluar] = await zakatKeluarQuery

  return {
    rt_id: rt.id,
    nama_rt: rt.nama_rt,
    keterangan: rt.keterangan || null,
    muzakki: {
      jumlah_muzakki_aktif: Number(muzakkiStats?.muzakki_aktif || 0),
    },
    mustahik: {
      total_keluarga: totalMustahikKeluarga,
      total_tanggungan: totalMustahikTanggungan,
      breakdown_per_asnaf: asnafBreakdown,
    },
    zakat_masuk: {
      total_dana: Number(zakatMasuk?.total_dana_masuk || 0),
      total_beras: Number(zakatMasuk?.total_beras_masuk || 0),
      jumlah_transaksi: Number(zakatMasuk?.jumlah_transaksi || 0),
    },
    zakat_keluar: {
      total_dana: Number(zakatKeluar?.total_dana_keluar || 0),
      total_beras: Number(zakatKeluar?.total_beras_keluar || 0),
      jumlah_distribusi: Number(zakatKeluar?.jumlah_distribusi || 0),
    },
    filter: {
      tahun_hijriah: tahun_hijriah || null,
      tahun_masehi: tahun_masehi || null,
    },
  }
}
