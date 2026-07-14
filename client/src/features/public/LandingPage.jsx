import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Button } from '@shared/components'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
} from '@shared/components'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Calculator, TrendingUp, LogIn, LayoutDashboard, Activity, Wallet, Wheat } from 'lucide-react'
import { useAuth } from '@features/auth/AuthContext'
import { hitungZakat } from './zakatCalculator'
import { formatCurrency, formatKg } from '@features/dashboard/useDashboardData'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
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

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['publik-summary'],
    queryFn: async () => {
      const response = await api.get('/publik/summary')
      return response.data
    },
  })

  useEffect(() => {
    if (configData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <>
      {/* Navbar Fixed with Safe Area Support */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm safe-area-top">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Kiri: Logo dan Nama Aplikasi */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-emerald-600 rounded-lg shadow-sm">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                SIKAT
              </span>
            </div>

            {/* Kanan: Tombol Login / Masuk Dashboard */}
            <div>
              {isAuthenticated ? (
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Masuk Dashboard</span>
                    <span className="xs:hidden">Dashboard</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <Link to="/login">
                    <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content dengan padding-top untuk navbar */}
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16 sm:pt-20 lg:pt-16">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:py-8 lg:py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">SIKAT</h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto px-2">
            Sikat Merupakan Platform terpadu untuk pengelolaan zakat, infaq, dan sedekah berbasis RT di lingkungan Masjid.
            Transparan, akurat, dan mudah diakses.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 mb-8 sm:mb-12">
          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                <span className="hidden sm:inline">Kalkulator Zakat Mandiri</span>
                <span className="sm:hidden">Kalkulator Zakat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
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
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-3 sm:p-4 sm:p-6">
              <div className="w-full space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 bg-emerald-50 rounded-lg border border-emerald-100 gap-1 sm:gap-0">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-emerald-900">Zakat Fitrah (Uang)</p>
                    <p className="text-[10px] sm:text-xs text-emerald-700">Jiwa × Harga Beras × 2.5</p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-900 text-right sm:text-right">
                    {isInvalidInput ? '-' : formatCurrency(hasil.zakat_fitrah_uang)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 bg-blue-50 rounded-lg border border-blue-100 gap-1 sm:gap-0">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-900">Zakat Fitrah (Beras)</p>
                    <p className="text-[10px] sm:text-xs text-blue-700">Jiwa × 2.5 kg</p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-blue-900 text-right sm:text-right">
                    {isInvalidInput ? '-' : `${hasil.zakat_fitrah_beras.toLocaleString('id-ID')} kg`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 bg-amber-50 rounded-lg border border-amber-100 gap-1 sm:gap-0">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-900">Zakat Mal</p>
                    <p className="text-[10px] sm:text-xs text-amber-700">max(0, Harta - Nisab) × 2.5%</p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-amber-900 text-right sm:text-right">
                    {isInvalidInput ? '-' : formatCurrency(hasil.zakat_mal)}
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                Ringkasan Publik
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 sm:p-6">
              {isLoading && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="h-3 sm:h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 sm:h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                </div>
              )} {!isLoading && summaryData && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Stats Row 1 */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                      <p className="text-[10px] sm:text-xs font-medium text-cyan-700 mb-0.5 sm:mb-1">Total Muzakki Aktif</p>
                      <p className="text-base sm:text-xl font-bold text-cyan-900">
                        {summaryData.chart_perbandingan_rt?.reduce((sum, rt) => sum + (rt.muzakki || 0), 0) || 0} Muzakki
                      </p>
                    </div>
                    <div className="p-2 sm:p-4 bg-violet-50 rounded-lg border border-violet-200">
                      <p className="text-[10px] sm:text-xs font-medium text-violet-700 mb-0.5 sm:mb-1">Total Mustahik</p>
                      <p className="text-base sm:text-xl font-bold text-violet-900">
                        {summaryData.chart_perbandingan_rt?.reduce((sum, rt) => sum + (rt.mustahik || 0), 0) || 0} Mustahik
                      </p>
                    </div>
                  </div>

                  {/* Summary Stats Row 2 */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-[10px] sm:text-xs font-medium text-emerald-700 mb-0.5 sm:mb-1">Total Dana</p>
                      <p className="text-xs sm:text-xl font-bold text-emerald-900">{formatCurrency(summaryData.total_nominal)}</p>
                    </div>
                    <div className="p-2 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1">Total Beras</p>
                      <p className="text-xs sm:text-xl font-bold text-blue-900">{formatKg(summaryData.total_beras)}</p>
                    </div>
                    <div className="p-2 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-[10px] sm:text-xs font-medium text-purple-700 mb-0.5 sm:mb-1">Dana Keluar</p>
                      <p className="text-xs sm:text-xl font-bold text-purple-900">
                        {formatCurrency(summaryData.chart_asnaf_uang?.reduce((sum, item) => sum + item.jumlah, 0) || 0)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-[10px] sm:text-xs font-medium text-amber-700 mb-0.5 sm:mb-1">Beras Keluar</p>
                      <p className="text-xs sm:text-xl font-bold text-amber-900">
                        {formatKg(summaryData.chart_asnaf_beras?.reduce((sum, item) => sum + item.jumlah, 0) || 0)}
                      </p>
                    </div>
                  </div>

                  {(summaryData.chart_perbandingan_rt?.length > 0 || summaryData.chart_asnaf_uang?.length > 0 || summaryData.chart_asnaf_beras?.length > 0) && (
                    <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                      {/* Bar Chart: Perbandingan Muzakki & Mustahik per RT */}
                      {summaryData.chart_perbandingan_rt?.length > 0 && (
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3">Perbandingan Muzakki & Mustahik per RT</h3>
                          <div className="h-48 sm:h-60 md:h-70">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={summaryData.chart_perbandingan_rt}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="nama_rt" tick={{ fontSize: 10 }} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                                <Tooltip
                                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                  formatter={(value, name) => [value, name]}
                                />
                                <Legend />
                                <Bar dataKey="muzakki" name="Muzakki" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="mustahik" name="Mustahik" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Pie Charts: Proporsi Distribusi per Asnaf */}
                      {(summaryData.chart_asnaf_uang?.length > 0 || summaryData.chart_asnaf_beras?.length > 0) && (
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3">Proporsi Distribusi per Asnaf</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {/* Pie Chart: Distribusi Uang */}
                            {summaryData.chart_asnaf_uang?.length > 0 && (
                              <div className="bg-slate-50 rounded-lg p-2 sm:p-4">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <Wallet className="h-4 w-4 text-emerald-600" />
                                  <span className="text-xs sm:text-sm font-medium text-slate-700">Distribusi Uang</span>
                                </div>
                                <div className="h-48 sm:h-60">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={summaryData.chart_asnaf_uang}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={50}
                                        fill="#8884d8"
                                        dataKey="jumlah"
                                        nameKey="kategori"
                                      >
                                        {summaryData.chart_asnaf_uang.map((_, index) => (
                                          <Cell key={`cell-uang-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#84cc16'][index % 8]} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        formatter={(value, name) => [formatCurrency(value), name]}
                                      />
                                      <Legend formatter={(value) => value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* Pie Chart: Distribusi Beras */}
                            {summaryData.chart_asnaf_beras?.length > 0 && (
                              <div className="bg-slate-50 rounded-lg p-2 sm:p-4">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <Wheat className="h-4 w-4 text-amber-600" />
                                  <span className="text-xs sm:text-sm font-medium text-slate-700">Distribusi Beras</span>
                                </div>
                                <div className="h-48 sm:h-60">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={summaryData.chart_asnaf_beras}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={50}
                                        fill="#8884d8"
                                        dataKey="jumlah"
                                        nameKey="kategori"
                                      >
                                        {summaryData.chart_asnaf_beras.map((_, index) => (
                                          <Cell key={`cell-beras-${index}`} fill={['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#84cc16'][index % 8]} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        formatter={(value, name) => [`${value.toLocaleString('id-ID')} kg`, name]}
                                      />
                                      <Legend formatter={(value) => value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="text-center text-xs sm:text-sm text-slate-500 mt-8 sm:mt-12 pb-4 sm:pb-6 safe-area-bottom">
          <p>© {new Date().getFullYear()} SIKAT. Semua data ditampilkan dalam bentuk Real-time tanpa informasi pribadi.</p>
        </footer>
      </div>
    </main>
    </>
  )
}
