import db from '../db.js'
import { LaporanExportQuerySchema } from '../schemas/laporan.schema.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export async function getLaporanExportData(queryParams, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = LaporanExportQuerySchema.parse(queryParams)

  const validJenis = parsed.jenis_zakat === 'semua' ? null : parsed.jenis_zakat

  // Build base filters for year
  const tahunFilter = {}
  if (parsed.tahun_hijriah) tahunFilter.tahun_hijriah = parsed.tahun_hijriah
  if (parsed.tahun_masehi) tahunFilter.tahun_masehi = parsed.tahun_masehi

  // ==================== TRANSAKSI MASUK ====================
  let masukQuery = connection('zakat_masuk')
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
    masukQuery = masukQuery.where('zakat_masuk.tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    masukQuery = masukQuery.where('zakat_masuk.tahun_masehi', parsed.tahun_masehi)
  }
  if (validJenis) {
    masukQuery = masukQuery.where('zakat_masuk.jenis_zakat', validJenis)
  }
  if (parsed.wilayah_rt_id) {
    masukQuery = masukQuery.where('muzakki.wilayah_rt_id', parsed.wilayah_rt_id)
  }

  const transaksiMasuk = await masukQuery.orderBy('zakat_masuk.created_at', 'asc').limit(10000)

  // ==================== TRANSAKSI KELUAR ====================
  let keluarQuery = connection('zakat_keluar')
    .join('mustahik_asnaf', 'zakat_keluar.mustahik_id', 'mustahik_asnaf.id')
    .join('users as admin', 'zakat_keluar.admin_id', 'admin.id')
    .join('wilayah_rt', 'mustahik_asnaf.wilayah_rt_id', 'wilayah_rt.id')
    .select(
      'zakat_keluar.*',
      'mustahik_asnaf.nama_kepala_keluarga as nama_mustahik',
      'mustahik_asnaf.kategori_asnaf',
      'wilayah_rt.nama_rt',
      'admin.full_name as nama_admin'
    )

  if (parsed.tahun_hijriah) {
    keluarQuery = keluarQuery.where('zakat_keluar.tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    keluarQuery = keluarQuery.where('zakat_keluar.tahun_masehi', parsed.tahun_masehi)
  }
  if (parsed.wilayah_rt_id) {
    keluarQuery = keluarQuery.where('mustahik_asnaf.wilayah_rt_id', parsed.wilayah_rt_id)
  }

  const transaksiKeluar = await keluarQuery.orderBy('zakat_keluar.created_at', 'asc').limit(10000)

  // ==================== SUMMARY PER JENIS ZAKAT (MASUK) ====================
  const summaryMasukQuery = connection('zakat_masuk')
    .join('muzakki', 'zakat_masuk.muzakki_id', 'muzakki.id')

  if (parsed.tahun_hijriah) {
    summaryMasukQuery.where('zakat_masuk.tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    summaryMasukQuery.where('zakat_masuk.tahun_masehi', parsed.tahun_masehi)
  }
  if (parsed.wilayah_rt_id) {
    summaryMasukQuery.where('muzakki.wilayah_rt_id', parsed.wilayah_rt_id)
  }

  const summaryMasuk = await summaryMasukQuery
    .groupBy('zakat_masuk.jenis_zakat')
    .select(
      'zakat_masuk.jenis_zakat',
      connection.raw('COUNT(*) as jumlah_transaksi'),
      connection.raw('COALESCE(SUM(zakat_masuk.nominal), 0) as total_nominal'),
      connection.raw('COALESCE(SUM(zakat_masuk.berat_kg), 0) as total_beras')
    )

  // ==================== SUMMARY PER ASNAF (KELUAR) ====================
  const summaryAsnafQuery = connection('zakat_keluar')
    .join('mustahik_asnaf', 'zakat_keluar.mustahik_id', 'mustahik_asnaf.id')

  if (parsed.tahun_hijriah) {
    summaryAsnafQuery.where('zakat_keluar.tahun_hijriah', parsed.tahun_hijriah)
  }
  if (parsed.tahun_masehi) {
    summaryAsnafQuery.where('zakat_keluar.tahun_masehi', parsed.tahun_masehi)
  }
  if (parsed.wilayah_rt_id) {
    summaryAsnafQuery.where('mustahik_asnaf.wilayah_rt_id', parsed.wilayah_rt_id)
  }

  const summaryAsnaf = await summaryAsnafQuery
    .groupBy('mustahik_asnaf.kategori_asnaf')
    .select(
      'mustahik_asnaf.kategori_asnaf',
      connection.raw('COUNT(*) as jumlah_distribusi'),
      connection.raw('COALESCE(SUM(zakat_keluar.nominal), 0) as total_nominal'),
      connection.raw('COALESCE(SUM(zakat_keluar.berat_kg), 0) as total_beras')
    )

  // ==================== TOTAL KESELURUHAN ====================
  // Total pemasukan keseluruhan
  const totalDanaMasuk = summaryMasuk.reduce((acc, item) => acc + Number(item.total_nominal || 0), 0)
  const totalBerasMasuk = summaryMasuk.reduce((acc, item) => acc + Number(item.total_beras || 0), 0)

  // Total pengeluaran keseluruhan
  const totalDanaKeluar = summaryAsnaf.reduce((acc, item) => acc + Number(item.total_nominal || 0), 0)
  const totalBerasKeluar = summaryAsnaf.reduce((acc, item) => acc + Number(item.total_beras || 0), 0)

  // Sisa saldo
  const sisaDana = totalDanaMasuk - totalDanaKeluar
  const sisaBeras = totalBerasMasuk - totalBerasKeluar

  // ==================== DATA RT ====================
  const wilayahRt = await connection('wilayah_rt')
    .select('id', 'nama_rt', 'keterangan')
    .orderBy('nama_rt', 'asc')

  // Muzakki & Mustahik counts
  const muzakkiCount = await connection('muzakki')
    .where('is_active', true)
    .count('id as total')

  const mustahikCount = await connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .count('id as total')

  return {
    params: parsed,
    // Backward compatibility - original structure
    data: transaksiMasuk || [],
    total: (transaksiMasuk || []).length,
    // New comprehensive structure
    transaksi_masuk: transaksiMasuk || [],
    transaksi_keluar: transaksiKeluar || [],
    summary_masuk: summaryMasuk || [],
    summary_asnaf: summaryAsnaf || [],
    posisi_keuangan: {
      aset: {
        kas_dan_bank: sisaDana,
        persediaan_beras: sisaBeras,
      },
      passiva: {
        kewajiban: 0, // Tidak ada kewajiban dalam sistem sederhana
        dana_terikat: 0,
        dana_tidak_terikat: sisaDana,
      },
      total_aset: sisaDana + (sisaBeras * 15000), // Estimasi nilai beras
      muzakki_count: Number(muzakkiCount[0]?.total || 0),
      mustahik_count: Number(mustahikCount[0]?.total || 0),
    },
    arus_kas: {
      saldo_awal: 0,
      total_pemasukan_dana: totalDanaMasuk,
      total_pemasukan_beras: totalBerasMasuk,
      total_pengeluaran_dana: totalDanaKeluar,
      total_pengeluaran_beras: totalBerasKeluar,
      saldo_akhir_dana: sisaDana,
      saldo_akhir_beras: sisaBeras,
    },
    perubahan_dana: {
      saldo_awal: 0,
      pemasukan_per_jenis: summaryMasuk.map((item) => ({
        jenis: item.jenis_zakat,
        jumlah_transaksi: Number(item.jumlah_transaksi),
        nominal: Number(item.total_nominal),
        beras: Number(item.total_beras),
      })),
      penyaluran_per_asnaf: summaryAsnaf.map((item) => ({
        asnaf: item.kategori_asnaf,
        jumlah_distribusi: Number(item.jumlah_distribusi),
        nominal: Number(item.total_nominal),
        beras: Number(item.total_beras),
      })),
      saldo_akhir: sisaDana,
    },
    wilayah_rt: wilayahRt,
    metadata: {
      total_transaksi_masuk: transaksiMasuk.length,
      total_transaksi_keluar: transaksiKeluar.length,
      periode: {
        tahun_hijriah: parsed.tahun_hijriah || null,
        tahun_masehi: parsed.tahun_masehi || null,
      },
    },
  }
}
