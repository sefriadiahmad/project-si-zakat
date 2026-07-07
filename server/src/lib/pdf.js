import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Handle different import styles for autoTable
const createTable = autoTable.default || autoTable

export async function buildPdfLaporan(data, params, opts = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const { MASJID_NAME = 'Masjid Al-Ikhlas', ADMIN_NAME = '', ADMIN_JABATAN = 'Admin Masjid' } = opts

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(MASJID_NAME, pageWidth / 2, y, { align: 'center' })
  y += 10

  const periode = []
  if (params?.tahun_hijriah) periode.push(`${params.tahun_hijriah} H`)
  if (params?.tahun_masehi) periode.push(`${params.tahun_masehi} M`)
  const periodeText = periode.length > 0 ? periode.join(' / ') : 'Semua Periode'

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Laporan Keuangan Zakat, Infaq, dan Sedekah`, pageWidth / 2, y, { align: 'center' })
  y += 8
  doc.text(`Periode: ${periodeText}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  const rows = (data || []).map((item) => [
    item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    item.session_id || '-',
    item.nama_muzakki || '-',
    item.nama_rt || '-',
    item.jenis_zakat || '-',
    `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}`,
    item.jenis_zakat === 'fitrah_beras' ? `${(Number(item.berat_kg) || 0).toLocaleString('id-ID')} kg` : '-',
    item.metode_bayar || '-',
  ])

  createTable(doc, {
    startY: y,
    head: [['Tanggal', 'Nomor Transaksi', 'Muzakki', 'RT', 'Jenis', 'Nominal', 'Beras', 'Metode']],
    body: rows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 242, 245], textColor: [15, 23, 42], fontStyle: 'bold' },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  if (y > 260) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan', margin, y)
  y += 6

  const totalNominal = (data || []).reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
  const totalBeras = (data || []).reduce((acc, item) => acc + (Number(item.berat_kg) || 0), 0)

  doc.setFont('helvetica', 'normal')
  doc.text(`Total Pemasukan: Rp ${totalNominal.toLocaleString('id-ID')}`, margin, y)
  y += 6
  doc.text(`Total Beras: ${totalBeras.toLocaleString('id-ID')} kg`, margin, y)
  y += 10

  if (ADMIN_NAME) {
    doc.setFontSize(10)
    doc.text(`Dicetak oleh: ${ADMIN_NAME} (${ADMIN_JABATAN})`, margin, y)
    y += 6
  }

  doc.setFontSize(9)
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })

  return doc
}
