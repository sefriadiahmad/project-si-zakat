import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { Calculator, TrendingUp, Users, Wheat } from 'lucide-react'
import { hitungZakat } from './zakatCalculator'
import { formatCurrency, formatKg } from '@features/dashboard/useDashboardData'

export default function LandingPage() {
  const [jumlahJiwa, setJumlahJiwa] = useState(1)
  const [hargaBeras, setHargaBeras] = useState(12000)
  const [nilaiHarta, setNilaiHarta] = useState(0)
  const [nilaiNisab, setNilaiNisab] = useState(5240000)

  const { data: configData } = useQuery({
    queryKey: ['publik-kalkulator-config'],
    queryFn: async () => {
      const response = await api.get('/publik/kalkulator-config')
      return response.data
    },
  })

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['publik-summary'],
    queryFn: async () => {
      const response = await api.get('/publik/summary')
      return response.data
    },
  })

  useEffect(() => {
    if (configData) {
      setHargaBeras(configData.harga_beras_per_kg || 12000)
      setNilaiNisab(configData.nilai_nisab || 5240000)
    }
  }, [configData])

  const hasil = hitungZakat({
    jumlah_jiwa: jumlahJiwa,
    harga_beras_per_kg: hargaBeras,
    nilai_harta: nilaiHarta,
    nilai_nisab: nilaiNisab,
  })

  const isInvalidInput = jumlahJiwa < 1 || hargaBeras < 0 || nilaiHarta < 0 || nilaiNisab < 0

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Sistem Informasi Zakat</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Platform terpadu untuk pengelolaan zakat, infaq, dan sedekah berbasis RT di lingkungan Masjid.
            Transparan, akurat, dan mudah diakses.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-12">
          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Kalkulator Zakat Mandiri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jumlahJiwa" className="font-medium text-slate-700">Jumlah Jiwa</Label>
                  <Input
                    id="jumlahJiwa"
                    type="number"
                    min={1}
                    max={99}
                    value={jumlahJiwa}
                    onChange={(e) => setJumlahJiwa(Number(e.target.value))}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hargaBeras" className="font-medium text-slate-700">Harga Beras per Kg (Rp)</Label>
                  <Input
                    id="hargaBeras"
                    type="number"
                    min={0}
                    value={hargaBeras}
                    onChange={(e) => setHargaBeras(Number(e.target.value))}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nilaiHarta" className="font-medium text-slate-700">Nilai Harta (Rp)</Label>
                  <Input
                    id="nilaiHarta"
                    type="number"
                    min={0}
                    value={nilaiHarta}
                    onChange={(e) => setNilaiHarta(Number(e.target.value))}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nilaiNisab" className="font-medium text-slate-700">Nilai Nisab (Rp)</Label>
                  <Input
                    id="nilaiNisab"
                    type="number"
                    min={0}
                    value={nilaiNisab}
                    onChange={(e) => setNilaiNisab(Number(e.target.value))}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Zakat Fitrah (Uang)</p>
                    <p className="text-xs text-emerald-700">Jiwa × Harga Beras × 2.5</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">
                    {isInvalidInput ? '-' : formatCurrency(hasil.zakat_fitrah_uang)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Zakat Fitrah (Beras)</p>
                    <p className="text-xs text-blue-700">Jiwa × 2.5 kg</p>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {isInvalidInput ? '-' : `${hasil.zakat_fitrah_beras.toLocaleString('id-ID')} kg`}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-amber-900">Zakat Mal</p>
                    <p className="text-xs text-amber-700">max(0, Harta - Nisab) × 2.5%</p>
                  </div>
                  <p className="text-lg font-bold text-amber-900">
                    {isInvalidInput ? '-' : formatCurrency(hasil.zakat_mal)}
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Ringkasan Publik
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading && (
                <div className="space-y-4">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                </div>
              )}
              {error && (
                <p className="text-sm text-red-600 font-medium">Gagal memuat data publik.</p>
              )}
              {!isLoading && !error && summaryData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Total Dana Terkumpul</p>
                      <p className="text-xl font-bold text-emerald-900">{formatCurrency(summaryData.total_nominal)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">Total Beras Terkumpul</p>
                      <p className="text-xl font-bold text-blue-900">{formatKg(summaryData.total_beras)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs font-medium text-purple-700 mb-1">Muzakki Aktif</p>
                      <p className="text-xl font-bold text-purple-900">{summaryData.chart_muzakki_rt?.length || 0} RT</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs font-medium text-amber-700 mb-1">Distribusi Asnaf</p>
                      <p className="text-xl font-bold text-amber-900">{summaryData.chart_asnaf_donat?.length || 0} Kategori</p>
                    </div>
                  </div>

                  {(summaryData.chart_muzakki_rt?.length > 0 || summaryData.chart_asnaf_donat?.length > 0) && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribusi per Wilayah</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-semibold text-slate-700">Wilayah RT</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-700">Muzakki</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summaryData.chart_muzakki_rt?.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm text-slate-900">{row.nama_rt}</TableCell>
                              <TableCell className="text-right text-sm text-slate-700">{row.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Sistem Informasi Zakat. Semua data ditampilkan dalam bentuk agregat tanpa informasi pribadi.</p>
        </footer>
      </div>
    </main>
  )
}
