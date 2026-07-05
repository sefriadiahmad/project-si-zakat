import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generatePdfA4(sessionData, opts = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })

  const { MASJID_NAME = 'Masjid example', ADMIN_NAME = '' } = opts
  const first = sessionData?.[0] || {}
  const namaMuzakki = first?.nama_muzakki || '-'
  const namaRt = first?.nama_rt || '-'
  const namaKasir = first?.nama_kasir || '-'
  const metodeBayar = first?.metode_bayar || '-'
  const sessionId = first?.session_id || '-'
  const createdAt = first?.created_at || new Date().toISOString()

  const fmtCurrency = (v) => `Rp ${(Number(v) || 0).toLocaleString('id-ID')}`
  const fmtKg = (v) => `${(Number(v) || 0).toLocaleString('id-ID')} kg`

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(MASJID_NAME, pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Bukti Transaksi Zakat / Infaq / Sedekah', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  const headerLines = [
    ['Nomor Transaksi', sessionId],
    ['Tanggal / Waktu', new Date(createdAt).toLocaleString('id-ID')],
    ['Muzakki', namaMuzakki],
    ['Wilayah RT', namaRt],
    ['Metode Bayar', metodeBayar],
    ['Kasir', namaKasir],
  ]

  doc.setFontSize(10)
  headerLines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), margin + 40, y)
    y += 6
  })

  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  const tableBody = (sessionData || []).map((item) => [
    item?.jenis_zakat || '-',
    item?.jenis_zakat === 'fitrah_beras' ? '-' : fmtCurrency(item?.nominal || 0),
    item?.jenis_zakat === 'fitrah_beras' ? fmtKg(item?.berat_kg || 0) : '-',
    ['fitrah_uang', 'fitrah_beras', 'fidyah'].includes(item?.jenis_zakat) ? String(item?.jumlah_jiwa || '-') : '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Jenis Zakat', 'Nominal', 'Beras', 'Jiwa']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [240, 242, 245], textColor: [15, 23, 42], fontStyle: 'bold' },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 8

  const totalNominal = (sessionData || []).reduce((acc, item) => acc + (Number(item?.nominal) || 0), 0)
  const totalBeras = (sessionData || []).reduce((acc, item) => acc + (Number(item?.berat_kg) || 0), 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Nominal: ${fmtCurrency(totalNominal)}`, margin, y)
  y += 6
  doc.text(`Total Beras: ${fmtKg(totalBeras)}`, margin, y)
  y += 10

  if (ADMIN_NAME) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak oleh: ${ADMIN_NAME}`, margin, y)
    y += 6
  }

  doc.setFontSize(9)
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })

  return doc
}
