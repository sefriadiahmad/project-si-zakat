import { JENIS_ZAKAT_LABELS, METODE_BAYAR_LABELS } from '@shared/constants'

export default function ThermalReceipt({ session, masjidName = 'Masjid example' }) {
  const first = session?.[0] || {}
  const totalNominal = (session || []).reduce((acc, item) => acc + (Number(item?.nominal) || 0), 0)
  const totalBeras = (session || []).reduce((acc, item) => acc + (Number(item?.berat_kg) || 0), 0)

  const fmt = (v) =>
    new Date(v).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="thermal-receipt">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
      <div className="w-[80mm] mx-auto font-mono text-xs leading-tight">
        <div className="text-center mb-2">
          <p className="font-bold text-sm">{masjidName}</p>
          <p>Bukti Transaksi Zakat / Infaq / Sedekah</p>
        </div>
        <div className="border-t border-dashed border-black mb-2" />
        <div className="space-y-1">
          <p>Nomor: {first?.session_id || '-'}</p>
          <p>Tanggal: {fmt(first?.created_at)}</p>
          <p>Muzakki: {first?.nama_muzakki || '-'}</p>
          <p>RT: {first?.nama_rt || '-'}</p>
          <p>Metode: {METODE_BAYAR_LABELS[first?.metode_bayar] || first?.metode_bayar || '-'}</p>
          <p>Kasir: {first?.nama_kasir || '-'}</p>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="space-y-1">
          {(session || []).map((item) => (
            <div key={item?.id || item?.jenis_zakat} className="flex justify-between">
              <span>{JENIS_ZAKAT_LABELS[item?.jenis_zakat] || item?.jenis_zakat}</span>
              <span>
                {item?.jenis_zakat !== 'fitrah_beras'
                  ? `Rp ${(Number(item?.nominal) || 0).toLocaleString('id-ID')}`
                  : `${(Number(item?.berat_kg) || 0).toLocaleString('id-ID')} kg`}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="space-y-1">
          <div className="flex justify-between font-bold">
            <span>Total Nominal</span>
            <span>Rp {totalNominal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Beras</span>
            <span>{totalBeras.toLocaleString('id-ID')} kg</span>
          </div>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <p className="text-center">--- Struk ini adalah bukti pembayaran sah ---</p>
      </div>
    </div>
  )
}
