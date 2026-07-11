import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Handle different import styles for autoTable
const createTable = autoTable.default || autoTable

export async function buildPdfLaporan(data, params, opts = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const { MASJID_NAME = 'SIKAT', ADMIN_NAME = '', ADMIN_JABATAN = 'Admin Masjid' } = opts

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(MASJID_NAME, pageWidth / 2, y, { align: 'center' })
  y += 8

  const periode = []
  if (params?.tahun_hijriah) periode.push(`${params.tahun_hijriah} H`)
  if (params?.tahun_masehi) periode.push(`${params.tahun_masehi} M`)
  const periodeText = periode.length > 0 ? periode.join(' / ') : 'Semua Periode'

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('LAPORAN KEUANGAN ZAKAT, INFAQ, DAN SEDEKAH', pageWidth / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(10)
  doc.text(`Periode: ${periodeText}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // ==================== 1. ARUS KAS ====================
  doc.setLineWidth(0.5)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ARUS KAS', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const totalDanaMasuk = Number(data.arus_kas?.total_pemasukan_dana) || 0
  const totalBerasMasuk = Number(data.arus_kas?.total_pemasukan_beras) || 0
  const totalDanaKeluar = Number(data.arus_kas?.total_pengeluaran_dana) || 0
  const totalBerasKeluar = Number(data.arus_kas?.total_pengeluaran_beras) || 0
  const saldoAkhirDana = Number(data.arus_kas?.saldo_akhir_dana) || 0
  const saldoAkhirBeras = Number(data.arus_kas?.saldo_akhir_beras) || 0

  const arusKasData = [
    ['SALDO AWAL', 'Rp 0', '0 kg'],
    ['Total Dana Masuk', `Rp ${totalDanaMasuk.toLocaleString('id-ID')}`, '-'],
    ['Total Beras Masuk', '-', `${totalBerasMasuk.toLocaleString('id-ID')} kg`],
    ['Total Dana Keluar', `Rp ${totalDanaKeluar.toLocaleString('id-ID')}`, '-'],
    ['Total Beras Keluar', '-', `${totalBerasKeluar.toLocaleString('id-ID')} kg`],
  ]

  createTable(doc, {
    startY: y,
    head: [['URAIAN', 'DANA', 'BERAS']],
    body: arusKasData,
    foot: [['SALDO AKHIR', `Rp ${saldoAkhirDana.toLocaleString('id-ID')}`, `${saldoAkhirBeras.toLocaleString('id-ID')} kg`]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  // ==================== 2. POSISI KEUANGAN ====================
  if (y > 240) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN POSISI KEUANGAN', margin, y)
  y += 8

  const kasBank = Number(data.posisi_keuangan?.aset?.kas_dan_bank) || 0
  const persediaanBeras = Number(data.posisi_keuangan?.aset?.persediaan_beras) || 0
  const totalAset = kasBank

  const posisiData = [
    ['ASET', '', ''],
    ['Kas dan Bank', `Rp ${kasBank.toLocaleString('id-ID')}`, ''],
    ['Persediaan Beras', `${persediaanBeras.toLocaleString('id-ID')} kg`, ''],
    ['', '', ''],
    ['PASSIVA', '', ''],
    ['Kewajiban', 'Rp 0', ''],
    ['Dana Tidak Terikat', `Rp ${kasBank.toLocaleString('id-ID')}`, ''],
    ['', '', ''],
    ['DATA PENDUKUNG', '', ''],
    ['Total Muzakki Aktif', `${Number(data.posisi_keuangan?.muzakki_count) || 0} Orang`, ''],
    ['Total Mustahik Terverifikasi', `${Number(data.posisi_keuangan?.mustahik_count) || 0} Keluarga`, ''],
  ]

  createTable(doc, {
    startY: y,
    head: [['URAIAN', 'NOMINAL', '']],
    body: posisiData,
    foot: [['TOTAL ASET', `Rp ${totalAset.toLocaleString('id-ID')}`, '']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  // ==================== 3. PERUBAHAN DANA ====================
  if (y > 200) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN PERUBAHAN DANA', margin, y)
  y += 8

  // Pemasukan
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Pemasukan per Jenis Zakat:', margin, y)
  y += 6

  const pemasukanRows = (data.perubahan_dana?.pemasukan_per_jenis || []).map((item) => [
    item.jenis || '-',
    `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}`,
    `${(Number(item.beras) || 0).toLocaleString('id-ID')} kg`,
  ])

  // Calculate totals for pemasukan
  const totalPemasukanNominal = (data.perubahan_dana?.pemasukan_per_jenis || []).reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
  const totalPemasukanBeras = (data.perubahan_dana?.pemasukan_per_jenis || []).reduce((acc, item) => acc + (Number(item.beras) || 0), 0)

  if (pemasukanRows.length > 0) {
    createTable(doc, {
      startY: y,
      head: [['JENIS ZAKAT', 'NOMINAL', 'BERAS']],
      body: pemasukanRows,
      foot: [['TOTAL PEMASUKAN', `Rp ${totalPemasukanNominal.toLocaleString('id-ID')}`, `${totalPemasukanBeras.toLocaleString('id-ID')} kg`]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'striped',
    })
    y = doc.lastAutoTable.finalY + 6
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Tidak ada pemasukan', margin, y)
    y += 6
  }

  // Penyaluran
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Penyaluran per Asnaf:', margin, y)
  y += 6

  const pengeluaranRows = (data.perubahan_dana?.penyaluran_per_asnaf || []).map((item) => [
    item.asnaf || '-',
    `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}`,
    `${(Number(item.beras) || 0).toLocaleString('id-ID')} kg`,
  ])

  // Calculate totals for pengeluaran
  const totalPengeluaranNominal = (data.perubahan_dana?.penyaluran_per_asnaf || []).reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
  const totalPengeluaranBeras = (data.perubahan_dana?.penyaluran_per_asnaf || []).reduce((acc, item) => acc + (Number(item.beras) || 0), 0)

  if (pengeluaranRows.length > 0) {
    createTable(doc, {
      startY: y,
      head: [['KATEGORI ASNAF', 'NOMINAL', 'BERAS']],
      body: pengeluaranRows,
      foot: [['TOTAL PENYALURAN', `Rp ${totalPengeluaranNominal.toLocaleString('id-ID')}`, `${totalPengeluaranBeras.toLocaleString('id-ID')} kg`]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'striped',
    })
    y = doc.lastAutoTable.finalY + 6
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Tidak ada penyaluran', margin, y)
    y += 6
  }

  // ==================== 4. RINCIAN TRANSAKSI MASUK ====================
  doc.addPage()
  y = 20

  doc.setLineWidth(0.5)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RINCIAN TRANSAKSI PEMASUKAN', margin, y)
  y += 8

  const transaksiMasukRows = (data.transaksi_masuk || []).slice(0, 50).map((item) => [
    item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    item.session_id || '-',
    item.nama_muzakki || '-',
    item.nama_rt || '-',
    item.jenis_zakat || '-',
    `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}`,
    item.jenis_zakat === 'fitrah_beras' ? `${(Number(item.berat_kg) || 0).toLocaleString('id-ID')} kg` : '-',
  ])

  // Calculate totals for transaksi masuk
  const totalTransaksiMasukNominal = (data.transaksi_masuk || []).reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
  const totalTransaksiMasukBeras = (data.transaksi_masuk || []).reduce((acc, item) => acc + (Number(item.berat_kg) || 0), 0)

  if (transaksiMasukRows.length > 0) {
    createTable(doc, {
      startY: y,
      head: [['Tanggal', 'No. Transaksi', 'Muzakki', 'RT', 'Jenis', 'Nominal', 'Beras']],
      body: transaksiMasukRows,
      foot: [['TOTAL', '', '', '', '', `Rp ${totalTransaksiMasukNominal.toLocaleString('id-ID')}`, `${totalTransaksiMasukBeras.toLocaleString('id-ID')} kg`]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Tidak ada transaksi pemasukan', margin, y)
    y += 20
  }

  // ==================== 5. RINCIAN TRANSAKSI KELUAR ====================
  doc.addPage()
  y = 20

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RINCIAN TRANSAKSI PENGELUARAN', margin, y)
  y += 8

  const transaksiKeluarRows = (data.transaksi_keluar || []).slice(0, 50).map((item) => [
    item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    item.nama_mustahik || '-',
    item.nama_rt || '-',
    item.kategori_asnaf || '-',
    `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}`,
    `${(Number(item.berat_kg) || 0).toLocaleString('id-ID')} kg`,
  ])

  // Calculate totals for transaksi keluar
  const totalTransaksiKeluarNominal = (data.transaksi_keluar || []).reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
  const totalTransaksiKeluarBeras = (data.transaksi_keluar || []).reduce((acc, item) => acc + (Number(item.berat_kg) || 0), 0)

  if (transaksiKeluarRows.length > 0) {
    createTable(doc, {
      startY: y,
      head: [['Tanggal', 'Mustahik', 'RT', 'Asnaf', 'Nominal', 'Beras']],
      body: transaksiKeluarRows,
      foot: [['TOTAL', '', '', '', `Rp ${totalTransaksiKeluarNominal.toLocaleString('id-ID')}`, `${totalTransaksiKeluarBeras.toLocaleString('id-ID')} kg`]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid',
    })
  }

  // Footer
  const footerY = 285
  if (ADMIN_NAME) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak oleh: ${ADMIN_NAME} (${ADMIN_JABATAN})`, margin, footerY)
  }
  doc.setFontSize(8)
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, footerY, { align: 'right' })

  return doc
}
