import * as XLSX from 'xlsx'

export async function buildWorkbook(data) {
  const rows = (data || []).map((item) => ({
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

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi')

  return workbook
}
