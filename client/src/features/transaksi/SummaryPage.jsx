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
  const { sessionId } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['zakat-session', sessionId],
    queryFn: async () => {
      const response = await api.get(`/zakat/masuk/${sessionId}`)
      return response.data
    },
    enabled: Boolean(sessionId),
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
      const response = await api.post(`/zakat/masuk/${sessionId}/print`, { print_type: printType })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zakat-session', sessionId] })
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
        setTimeout(() => reject(new Error('timeout')), 5000)
      )
      const pdfPromise = generatePdfA4(items, {
        MASJID_NAME: 'Masjid example',
        ADMIN_NAME: items[0]?.nama_kasir || '',
      })

      await Promise.race([pdfPromise, timeoutPromise])

      const doc = await pdfPromise
      doc.save(`zakat-${sessionId}.pdf`)
      printMutation.mutate('pdf')

      toast({
        title: 'PDF Berhasil Diunduh',
        description: 'Bukti setor PDF telah diunduh.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Gagal membuat PDF. Coba lagi.',
        description: 'Terjadi kesalahan saat membuat PDF.',
      })
    }
  }

  const handlePrint = () => {
    if (!items.length) return
    printMutation.mutate('struk')
    window.print()
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ringkasan Transaksi</h1>
          <p className="text-sm text-slate-500">Bukti transaksi zakat, infaq, dan sedekah.</p>
        </div>
        <Link to="/transaksi/baru">
          <Button variant="outline" className="border-slate-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Transaksi Baru
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-6 text-center text-slate-500 font-medium">Memuat data transaksi...</CardContent>
        </Card>
      ) : isError ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-6 text-center text-red-600 font-medium">Gagal memuat data transaksi.</CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Nomor Transaksi: {sessionId}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Muzakki</span>
                <span className="text-sm font-semibold text-slate-900">{items[0]?.nama_muzakki || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Wilayah RT</span>
                <span className="text-sm font-semibold text-slate-900">{items[0]?.nama_rt || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Kasir</span>
                <span className="text-sm font-semibold text-slate-900">{items[0]?.nama_kasir || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Metode Bayar</span>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700">
                  {METODE_BAYAR_LABELS[items[0]?.metode_bayar] || items[0]?.metode_bayar || '-'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Waktu</span>
                <span className="text-sm font-semibold text-slate-900">{items[0]?.created_at ? fmt(items[0].created_at) : '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900">Rincian Item</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-slate-700">Jenis Zakat</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-700">Nominal</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-700">Beras</th>
                    <th className="text-right px-4 py-2 font-semibold text-slate-700">Jiwa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{JENIS_ZAKAT_LABELS[item.jenis_zakat] || item.jenis_zakat}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {item.jenis_zakat !== 'fitrah_beras' ? `Rp ${(Number(item.nominal) || 0).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {item.jenis_zakat === 'fitrah_beras' ? `${(Number(item.berat_kg) || 0).toLocaleString('id-ID')} kg` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {['fitrah_uang', 'fitrah_beras', 'fidyah'].includes(item.jenis_zakat) ? item.jumlah_jiwa || '-' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            <CardFooter className="bg-emerald-50 border-t border-emerald-100 flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-emerald-900">Total Nominal</p>
                <p className="text-sm font-medium text-emerald-900">Total Beras</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-900">Rp {totalNominal.toLocaleString('id-ID')}</p>
                <p className="text-base font-semibold text-emerald-900">{totalBeras.toLocaleString('id-ID')} kg</p>
              </div>
            </CardFooter>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleDownloadPdf} className="gap-2 border-slate-200">
              <Download className="h-4 w-4" />
              Unduh PDF
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
          </div>

          <div className="hidden print:block">
            <ThermalReceipt session={items} masjidName="Masjid example" />
          </div>
        </>
      )}
    </div>
  )
}
