import { JENIS_ZAKAT_LABELS, METODE_BAYAR_LABELS } from '@shared/constants'

export default function ThermalReceipt({ session, masjidName = 'SIKAT' }) {
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
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          .thermal-paper {
            background: white !important;
            box-shadow: none !important;
          }
        }
        .thermal-paper {
          background: linear-gradient(to bottom, #fff 0%, #f8f8f8 100%);
        }
        .thermal-line {
          border-bottom: 1px dashed #333;
        }
      `}</style>
      <div className="w-[80mm] mx-auto font-mono text-[11px] leading-tight thermal-paper p-2 rounded-sm">
        {/* Header - Centered */}
        <div className="text-center mb-2">
          <p className="font-bold text-base tracking-wider">SIKAT</p>
          <p className="text-[10px] text-gray-600">{masjidName}</p>
        </div>

        {/* Date/Time Row - Aligned with receipt */}
        <div className="flex justify-between text-[10px] text-gray-700 mb-2">
          <span>Bukti Transaksi</span>
          <span>{fmt(first?.created_at)}</span>
        </div>

        <div className="thermal-line mb-2" />

        {/* Transaction Info */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-600">No. Transaksi</span>
            <span>{first?.session_id || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Muzakki</span>
            <span>{first?.nama_muzakki || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Wilayah</span>
            <span>{first?.nama_rt || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Metode Bayar</span>
            <span>{METODE_BAYAR_LABELS[first?.metode_bayar] || first?.metode_bayar || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Kasir</span>
            <span>{first?.nama_kasir || '-'}</span>
          </div>
        </div>

        <div className="thermal-line my-2" />

        {/* Items */}
        <div className="space-y-0.5">
          {(session || []).map((item) => (
            <div key={item?.id || item?.jenis_zakat} className="flex justify-between">
              <span className="truncate mr-2">{JENIS_ZAKAT_LABELS[item?.jenis_zakat] || item?.jenis_zakat}</span>
              <span className="whitespace-nowrap">
                {item?.jenis_zakat !== 'fitrah_beras'
                  ? `Rp ${(Number(item?.nominal) || 0).toLocaleString('id-ID')}`
                  : `${(Number(item?.berat_kg) || 0).toLocaleString('id-ID')} kg`}
              </span>
            </div>
          ))}
        </div>

        <div className="thermal-line my-2" />

        {/* Totals */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-bold text-sm">
            <span>Total Nominal</span>
            <span>Rp {totalNominal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>Total Beras</span>
            <span>{totalBeras.toLocaleString('id-ID')} kg</span>
          </div>
        </div>

        <div className="thermal-line my-2" />

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-600 italic">Terima kasih atas kepercayaan Anda</p>
        <p className="text-center text-[9px] text-gray-500 mt-1">--- Bukti pembayaran sah ---</p>
      </div>
    </div>
  )
}
