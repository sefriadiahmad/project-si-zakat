import { useState, useMemo } from 'react'
import { LogOut, UserPlus } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Button } from '@shared/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/card'
import { Input } from '@shared/components/input'
import { Label } from '@shared/components/label'
import { Skeleton } from '@shared/components/skeleton'
import { ROLE_LABELS } from '@shared/constants'
import { useAuth } from '@features/auth/AuthContext'
import { useDashboardData, formatCurrency, formatKg, DASIENA_COLORS } from './useDashboardData'
import UserManagementModal from '@features/admin/UserManagementModal'
import api from '@shared/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [tahunHijriah, setTahunHijriah] = useState('')
  const [tahunMasehi, setTahunMasehi] = useState('')
  const [userModalOpen, setUserModalOpen] = useState(false)

  const filter = useMemo(() => {
    const params = {}
    if (tahunHijriah) params.tahun_hijriah = tahunHijriah
    if (tahunMasehi) params.tahun_masehi = tahunMasehi
    return params
  }, [tahunHijriah, tahunMasehi])

  const { data, isLoading, isError, error } = useDashboardData(filter)

  // Fetch distribusi data
  const { data: distribusiData } = useQuery({
    queryKey: ['dashboard-distribusi', filter],
    queryFn: async () => {
      const response = await api.get('/distribusi/kuota', { params: filter })
      return response.data
    },
    staleTime: 10000,
  })

  const isTimeoutError = error?.message === 'Request timeout' || error?.message === 'Network Error'

  // KPI Cards
  const kpiCards = useMemo(() => {
    if (!data) return []
    return [
      { title: 'Total Dana Masuk', value: formatCurrency(data.total_nominal), icon: '💰', color: 'text-emerald-600' },
      { title: 'Total Dana Keluar', value: formatCurrency(distribusiData?.total_dana_keluar || 0), icon: '💸', color: 'text-red-600' },
      { title: 'Total Beras Masuk', value: formatKg(data.total_beras), icon: '🌾', color: 'text-amber-600' },
      { title: 'Total Beras Keluar', value: formatKg(distribusiData?.total_beras_keluar || 0), icon: '🍚', color: 'text-orange-600' },
    ]
  }, [data, distribusiData])

  // Perbandingan Dana data
  const perbandinganDanaData = useMemo(() => [
    { name: 'Dana Masuk', value: data?.total_nominal || 0 },
    { name: 'Dana Keluar', value: distribusiData?.total_dana_keluar || 0 },
  ], [data, distribusiData])

  // Perbandingan Beras data
  const perbandinganBerasData = useMemo(() => [
    { name: 'Beras Masuk', value: data?.total_beras || 0 },
    { name: 'Beras Keluar', value: distribusiData?.total_beras_keluar || 0 },
  ], [data, distribusiData])

  // Asnaf Uang chart data
  const asnafUangData = useMemo(() => {
    if (!distribusiData?.distribusi_asnaf) return []
    return distribusiData.distribusi_asnaf.map(item => ({
      kategori_asnaf: item.kategori_asnaf,
      total_nominal: Number(item.total_nominal) || 0,
    }))
  }, [distribusiData])

  // Asnaf Beras chart data
  const asnafBerasData = useMemo(() => {
    if (!distribusiData?.distribusi_asnaf) return []
    return distribusiData.distribusi_asnaf.map(item => ({
      kategori_asnaf: item.kategori_asnaf,
      total_beras: Number(item.total_beras) || 0,
    }))
  }, [distribusiData])

  // Mustahik per Asnaf chart data
  const mustahikByAsnafData = useMemo(() => {
    if (!distribusiData?.mustahik_by_asnaf) return []
    return distribusiData.mustahik_by_asnaf.map(item => ({
      kategori_asnaf: item.kategori_asnaf,
      count: Number(item.total) || 0,
    }))
  }, [distribusiData])

  const labelMap = {
    fakir: 'Fakir',
    miskin: 'Miskin',
    amil: 'Amil',
    mualaf: 'Mualaf',
    riqab: 'Riqab',
    gharim: 'Gharim',
    fisabilillah: 'Fisabilillah',
    ibnu_sabil: 'Ibnu Sabil',
  }

  return (
    <main className="min-h-screen bg-slate-50 p-3 sm:p-4 sm:p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-emerald-700">SIKAT</p>
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin_masjid' && (
              <Button variant="outline" onClick={() => setUserModalOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tambah Admin</span>
              </Button>
            )}
            <Button variant="outline" onClick={logout} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <Card className="rounded-lg mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Selamat datang, <span className="font-semibold text-slate-900">{user?.fullName}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">Peran: {ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <div className="space-y-1 flex-1 sm:flex-none">
                  <Label htmlFor="tahunHijriah" className="text-[10px] sm:text-xs font-medium text-slate-700">Tahun Hijriah</Label>
                  <Input
                    id="tahunHijriah"
                    type="number"
                    placeholder="1446"
                    value={tahunHijriah}
                    onChange={(e) => setTahunHijriah(e.target.value)}
                    className="h-8 sm:h-9 w-full sm:w-28 bg-white border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1 flex-1 sm:flex-none">
                  <Label htmlFor="tahunMasehi" className="text-[10px] sm:text-xs font-medium text-slate-700">Tahun Masehi</Label>
                  <Input
                    id="tahunMasehi"
                    type="number"
                    placeholder="2025"
                    value={tahunMasehi}
                    onChange={(e) => setTahunMasehi(e.target.value)}
                    className="h-8 sm:h-9 w-full sm:w-28 bg-white border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {kpiCards.map((_, idx) => (
              <Card key={idx} className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-3 sm:p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 sm:space-y-2 min-w-0 flex-1 mr-2">
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-32" />
                      <Skeleton className="h-5 sm:h-8 w-16 sm:w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isError && (
          <Card className="rounded-xl border border-red-200 bg-red-50 shadow-sm mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-red-700">
                {isTimeoutError
                  ? 'Data tidak dapat dimuat. Periksa koneksi dan coba lagi.'
                  : 'Gagal memuat data dashboard.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-3 border-red-200 hover:bg-white"
              >
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {kpiCards.map((card, idx) => (
                <Card key={idx} className="rounded-xl border border-slate-200/80 shadow-sm">
                  <CardContent className="p-3 sm:p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-[10px] sm:text-sm font-medium text-slate-600 truncate">{card.title}</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{card.value}</p>
                      </div>
                      <span className={`text-xl sm:text-2xl flex-shrink-0 ${card.color}`}>{card.icon}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Row 1: Perbandingan Dana & Beras */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Perbandingan Dana</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perbandinganDanaData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [formatCurrency(value), 'Jumlah']}
                        />
                        <Bar dataKey="value" name="Dana" radius={[4, 4, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Perbandingan Beras</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perbandinganBerasData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [formatKg(value), 'Jumlah']}
                        />
                        <Bar dataKey="value" name="Beras" radius={[4, 4, 0, 0]}>
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ea580c" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Muzakki per RT & Mustahik per Asnaf */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Muzakki per RT</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.chart_muzakki_rt || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="nama_rt" tick={{ fontSize: 9 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [value, 'Jumlah']}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Mustahik per Asnaf</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mustahikByAsnafData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="kategori_asnaf" tick={{ fontSize: 9 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [value, 'Jumlah']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Asnaf Uang & Asnaf Beras */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Distribusi Asnaf (Uang)</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={asnafUangData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="total_nominal"
                          nameKey="kategori_asnaf"
                        >
                          {asnafUangData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DASIENA_COLORS[index % DASIENA_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value, name) => [formatCurrency(value), labelMap[name] || name]}
                        />
                        <Legend formatter={(value) => labelMap[value] || value} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Distribusi Asnaf (Beras)</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={asnafBerasData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="total_beras"
                          nameKey="kategori_asnaf"
                        >
                          {asnafBerasData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DASIENA_COLORS[index % DASIENA_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value, name) => [formatKg(value), labelMap[name] || name]}
                        />
                        <Legend formatter={(value) => labelMap[value] || value} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* User Management Modal */}
        <UserManagementModal open={userModalOpen} onOpenChange={setUserModalOpen} />
      </div>
    </main>
  )
}
