import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { JENIS_ZAKAT_LABELS, METODE_BAYAR_LABELS } from '@shared/constants'
import { generatePdfA4 } from '@shared/lib/pdf'
import ThermalReceipt from './ThermalReceipt'

export default function SummaryPage() {
  // URL param is :id from route /transaksi/:id
  const { id: transactionId } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['zakat-session', transactionId],
    queryFn: async () => {
      const response = await api.get(`/zakat/masuk/${transactionId}`)
      return response.data
    },
    enabled: Boolean(transactionId),
  })

  const totalNominal = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.nominal) || 0), 0),
    [items]
  )
  const totalBeras = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.berat_kg) || 0), 0),
    [items]
  )

  const printMutation = useMutation({
    mutationFn: async (printType) => {
      const response = await api.post(`/zakat/masuk/${transactionId}/print`, { print_type: printType })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat-session', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Mencatat Cetakan',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const handleDownloadPdf = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const pdfPromise = generatePdfA4(items, {
        MASJID_NAME: 'Masjid Al-Ikhlas',
        ADMIN_NAME: items[0]?.nama_kasir || '',
      })

      const doc = await Promise.race([pdfPromise, timeoutPromise])
      doc.save(`zakat-${transactionId}.pdf`)

      // Record print after successful download
      printMutation.mutate('pdf')

      toast({
        title: 'PDF Berhasil Diunduh',
        description: 'Bukti setor PDF telah diunduh.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Gagal membuat PDF',
        description: 'Terjadi kesalahan saat membuat PDF.',
      })
    }
  }

  const handlePrint = () => {
    if (!items.length) return
    printMutation.mutate('struk')
    // Use setTimeout to allow mutation to complete before print dialog
    setTimeout(() => window.print(), 100)
  }

  const fmt = (v) =>
    new Date(v).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Ringkasan Transaksi</h1>
          <p className="text-xs sm:text-sm text-slate-500">Bukti transaksi zakat, infaq, dan sedekah.</p>
        </div>
        <Link to="/transaksi/baru">
          <Button variant="outline" className="gap-1.5 sm:gap-2 border-slate-200 text-xs sm:text-sm w-full sm:w-auto">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:inline">Transaksi Baru</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center text-slate-500 font-medium text-sm">Memuat data transaksi...</CardContent>
        </Card>
      ) : isError ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center text-red-600 font-medium text-sm">Gagal memuat data transaksi.</CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm">
            <CardHeader className="pb-2 sm:pb-0">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Nomor Transaksi: {transactionId}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600">Muzakki</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-none">{items[0]?.nama_muzakki || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600">Wilayah RT</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">{items[0]?.nama_rt || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600">Kasir</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">{items[0]?.nama_kasir || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600">Metode Bayar</span>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 text-[10px] sm:text-xs">
                  {METODE_BAYAR_LABELS[items[0]?.metode_bayar] || items[0]?.metode_bayar || '-'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600">Waktu</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">{items[0]?.created_at ? fmt(items[0].created_at) : '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Rincian Item</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-xs sm:text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold text-slate-700">Jenis Zakat</th>
                      <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Nominal</th>
                      <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Beras</th>
                      <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Jiwa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3 sm:px-4 py-2 font-medium text-slate-900">{JENIS_ZAKAT_LABELS[item.jenis_zakat] || item.jenis_zakat}</td>
                        <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                          {item.jenis_zakat !== 'fitrah_beras' ? `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                          {item.jenis_zakat === 'fitrah_beras' ? `${(Number(item.berat_kg) || 0).toLocaleString('id-ID')} kg` : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                          {['fitrah_uang', 'fitrah_beras', 'fidyah'].includes(item.jenis_zakat) ? item.jumlah_jiwa || '-' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-emerald-50 border-t border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs sm:text-sm font-medium text-emerald-900">Total Nominal</p>
                <p className="text-xs sm:text-sm font-medium text-emerald-900">Total Beras</p>
              </div>
              <div className="text-right">
                <p className="text-base sm:text-lg font-bold text-emerald-900">Rp {totalNominal.toLocaleString('id-ID')}</p>
                <p className="text-sm sm:text-base font-semibold text-emerald-900">{totalBeras.toLocaleString('id-ID')} kg</p>
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleDownloadPdf} className="gap-1.5 sm:gap-2 border-slate-200 text-xs sm:text-sm w-full sm:w-auto">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </Button>
            <Button onClick={handlePrint} className="gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm w-full sm:w-auto">
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cetak Struk</span>
            </Button>
          </div>

          <div className="hidden print:block">
            <ThermalReceipt session={items} masjidName="Masjid Al-Ikhlas" />
          </div>
        </>
      )}
    </div>
  )
}
