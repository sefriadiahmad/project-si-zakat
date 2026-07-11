import * as XLSX from 'xlsx'

export async function buildWorkbook(data) {
  const workbook = XLSX.utils.book_new()

  // ==================== 1. ARUS KAS ====================
  const arusKasRows = [
    ['LAPORAN ARUS KAS'],
    [''],
    ['URAIAN', 'DANA (Rp)', 'BERAS (Kg)'],
    ['SALDO AWAL', 0, 0],
    [''],
    ['PEMASUKAN'],
    ['Total Dana Masuk', Number(data.arus_kas?.total_pemasukan_dana || 0), 0],
    ['Total Beras Masuk', 0, Number(data.arus_kas?.total_pemasukan_beras || 0)],
    [''],
    ['PENGELUARAN'],
    ['Total Dana Keluar', Number(data.arus_kas?.total_pengeluaran_dana || 0), 0],
    ['Total Beras Keluar', 0, Number(data.arus_kas?.total_pengeluaran_beras || 0)],
    [''],
    ['SALDO AKHIR', Number(data.arus_kas?.saldo_akhir_dana || 0), Number(data.arus_kas?.saldo_akhir_beras || 0)],
  ]

  const arusKasSheet = XLSX.utils.aoa_to_sheet(arusKasRows)
  arusKasSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, arusKasSheet, 'Arus Kas')

  // ==================== 2. POSISI KEUANGAN ====================
  const posisiRows = [
    ['LAPORAN POSISI KEUANGAN'],
    [''],
    ['ASET'],
    ['KAS DAN BANK', Number(data.posisi_keuangan?.aset?.kas_dan_bank || 0), ''],
    ['PERSEDIAAN BERAS', Number(data.posisi_keuangan?.aset?.persediaan_beras || 0), 'Kg'],
    [''],
    ['PASSIVA'],
    ['KEWAJIBAN', Number(data.posisi_keuangan?.passiva?.kewajiban || 0), ''],
    ['DANA TERIKAT', Number(data.posisi_keuangan?.passiva?.dana_terikat || 0), ''],
    ['DANA TIDAK TERIKAT', Number(data.posisi_keuangan?.passiva?.dana_tidak_terikat || 0), ''],
    [''],
    ['JUMLAH ASET', Number(data.posisi_keuangan?.total_aset || 0), ''],
    [''],
    ['DATA PENDUKUNG'],
    ['Total Muzakki Aktif', Number(data.posisi_keuangan?.muzakki_count || 0), 'Orang'],
    ['Total Mustahik Terverifikasi', Number(data.posisi_keuangan?.mustahik_count || 0), 'Keluarga'],
  ]

  const posisiSheet = XLSX.utils.aoa_to_sheet(posisiRows)
  posisiSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, posisiSheet, 'Posisi Keuangan')

  // ==================== 3. PERUBAHAN DANA ====================
  const perubahanRows = [
    ['LAPORAN PERUBAHAN DANA'],
    [''],
    ['URAIAN', 'NOMINAL (Rp)', 'BERAS (Kg)'],
    [''],
    ['SALDO AWAL', 0, 0],
    [''],
    ['PENAMBAHAN DANA (PEMASUKAN)'],
  ]

  // Add pemasukan per jenis
  if (data.perubahan_dana?.pemasukan_per_jenis?.length > 0) {
    data.perubahan_dana.pemasukan_per_jenis.forEach((item) => {
      perubahanRows.push([
        `  - ${item.jenis || '-'}`,
        Number(item.nominal || 0),
        Number(item.beras || 0),
      ])
    })
  } else {
    perubahanRows.push(['  - Tidak ada pemasukan', 0, 0])
  }

  perubahanRows.push([''])
  perubahanRows.push(['PENURUNAN DANA (PENYALURAN)'])

  // Add penyaluran per asnaf
  if (data.perubahan_dana?.penyaluran_per_asnaf?.length > 0) {
    data.perubahan_dana.penyaluran_per_asnaf.forEach((item) => {
      perubahanRows.push([
        `  - ${item.asnaf || '-'}`,
        Number(item.nominal || 0),
        Number(item.beras || 0),
      ])
    })
  } else {
    perubahanRows.push(['  - Tidak ada penyaluran', 0, 0])
  }

  perubahanRows.push([''])
  perubahanRows.push(['SALDO AKHIR', Number(data.perubahan_dana?.saldo_akhir || 0), 0])

  const perubahanSheet = XLSX.utils.aoa_to_sheet(perubahanRows)
  perubahanSheet['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, perubahanSheet, 'Perubahan Dana')

  // ==================== 4. RINCIAN TRANSAKSI MASUK ====================
  const masukRows = (data.transaksi_masuk || []).map((item) => ({
    Tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    'Nomor Transaksi': item.session_id || '-',
    'Nama Muzakki': item.nama_muzakki || '-',
    'Wilayah RT': item.nama_rt || '-',
    'Jenis Zakat': item.jenis_zakat || '-',
    Nominal: Number(item.nominal || 0),
    'Beras (kg)': Number(item.berat_kg || 0),
    'Metode Bayar': item.metode_bayar || '-',
    Kasir: item.nama_kasir || '-',
  }))

  const masukSheet = XLSX.utils.json_to_sheet(masukRows)
  masukSheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
    { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(workbook, masukSheet, 'Transaksi Masuk')

  // ==================== 5. RINCIAN TRANSAKSI KELUAR ====================
  const keluarRows = (data.transaksi_keluar || []).map((item) => ({
    Tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    'Nama Mustahik': item.nama_mustahik || '-',
    'Wilayah RT': item.nama_rt || '-',
    'Kategori Asnaf': item.kategori_asnaf || '-',
    Nominal: Number(item.nominal || 0),
    'Beras (kg)': Number(item.berat_kg || 0),
    Keterangan: item.keterangan || '-',
    Admin: item.nama_admin || '-',
  }))

  const keluarSheet = XLSX.utils.json_to_sheet(keluarRows)
  keluarSheet['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 15 },
    { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(workbook, keluarSheet, 'Transaksi Keluar')

  // ==================== 6. SUMMARY MASUK ====================
  const summaryMasukRows = [
    ['RINGKASAN PEMASUKAN PER JENIS ZAKAT'],
    [''],
    ['JENIS ZAKAT', 'JUMLAH TRANSAKSI', 'TOTAL NOMINAL (Rp)', 'TOTAL BERAS (Kg)'],
  ]

  if (data.summary_masuk?.length > 0) {
    data.summary_masuk.forEach((item) => {
      summaryMasukRows.push([
        item.jenis_zakat || '-',
        Number(item.jumlah_transaksi || 0),
        Number(item.total_nominal || 0),
        Number(item.total_beras || 0),
      ])
    })
  }

  // Add total row
  const totalMasukNominal = data.summary_masuk?.reduce((acc, item) => acc + Number(item.total_nominal || 0), 0) || 0
  const totalMasukBeras = data.summary_masuk?.reduce((acc, item) => acc + Number(item.total_beras || 0), 0) || 0
  summaryMasukRows.push(['TOTAL', '', totalMasukNominal, totalMasukBeras])

  const summaryMasukSheet = XLSX.utils.aoa_to_sheet(summaryMasukRows)
  summaryMasukSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, summaryMasukSheet, 'Summary Masuk')

  // ==================== 7. SUMMARY KELUAR (ASNAF) ====================
  const summaryAsnafRows = [
    ['RINGKASAN PENYALURAN PER ASNAF'],
    [''],
    ['KATEGORI ASNAF', 'JUMLAH DISTRIBUSI', 'TOTAL NOMINAL (Rp)', 'TOTAL BERAS (Kg)'],
  ]

  if (data.summary_asnaf?.length > 0) {
    data.summary_asnaf.forEach((item) => {
      summaryAsnafRows.push([
        item.kategori_asnaf || '-',
        Number(item.jumlah_distribusi || 0),
        Number(item.total_nominal || 0),
        Number(item.total_beras || 0),
      ])
    })
  }

  // Add total row
  const totalAsnafNominal = data.summary_asnaf?.reduce((acc, item) => acc + Number(item.total_nominal || 0), 0) || 0
  const totalAsnafBeras = data.summary_asnaf?.reduce((acc, item) => acc + Number(item.total_beras || 0), 0) || 0
  summaryAsnafRows.push(['TOTAL', '', totalAsnafNominal, totalAsnafBeras])

  const summaryAsnafSheet = XLSX.utils.aoa_to_sheet(summaryAsnafRows)
  summaryAsnafSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, summaryAsnafSheet, 'Summary Asnaf')

  return workbook
}
