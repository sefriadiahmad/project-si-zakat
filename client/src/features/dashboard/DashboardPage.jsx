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

  const isTimeoutError = error?.message === 'Request timeout' || error?.message === 'Network Error'

  const kpiCards = useMemo(() => {
    if (!data) return []
    return [
      { title: 'Total Dana Terkumpul', value: formatCurrency(data.total_nominal), icon: '💰' },
      { title: 'Total Beras Terkumpul', value: formatKg(data.total_beras), icon: '🌾' },
      { title: 'Total Muzakki Aktif', value: data.total_muzakki_aktif.toLocaleString('id-ID'), icon: '👥' },
      { title: 'Total Mustahik Terverifikasi', value: data.total_mustahik_terverifikasi.toLocaleString('id-ID'), icon: '✅' },
    ]
  }, [data])

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Sistem Informasi Zakat</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin_masjid' && (
              <Button variant="outline" onClick={() => setUserModalOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <UserPlus className="h-4 w-4" />
                Tambah Admin
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </header>

        <Card className="rounded-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Selamat datang, <span className="font-semibold text-slate-900">{user?.fullName}</span>
                </p>
                <p className="text-xs text-slate-500">Peran: {ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <div className="flex gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tahunHijriah" className="text-xs font-medium text-slate-700">Tahun Hijriah</Label>
                  <Input
                    id="tahunHijriah"
                    type="number"
                    placeholder="Contoh: 1446"
                    value={tahunHijriah}
                    onChange={(e) => setTahunHijriah(e.target.value)}
                    className="h-9 w-32 bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tahunMasehi" className="text-xs font-medium text-slate-700">Tahun Masehi</Label>
                  <Input
                    id="tahunMasehi"
                    type="number"
                    placeholder="Contoh: 2025"
                    value={tahunMasehi}
                    onChange={(e) => setTahunMasehi(e.target.value)}
                    className="h-9 w-32 bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {kpiCards.map((card, idx) => (
              <Card key={idx} className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {kpiCards.map((card, idx) => (
                <Card key={idx} className="rounded-xl border border-slate-200/80 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{card.title}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                      </div>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-900">Muzakki per Wilayah RT</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.chart_muzakki_rt || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="nama_rt" tick={{ fontSize: 12 }} stroke="#64748b" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [value, 'Jumlah Muzakki']}
                        />
                        <Bar dataKey="count" name="Jumlah Muzakki" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-900">Proporsi Distribusi per Asnaf</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.chart_asnaf_donat || []}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ kategori_asnaf, percent }) => {
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
                            return `${labelMap[kategori_asnaf] || kategori_asnaf}: ${(percent * 100).toFixed(0)}%`
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total_nominal"
                          nameKey="kategori_asnaf"
                        >
                          {(data?.chart_asnaf_donat || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DASIENA_COLORS[index % DASIENA_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value) => [formatCurrency(value), 'Total Distribusi']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* User Management Modal */}
      <UserManagementModal open={userModalOpen} onOpenChange={setUserModalOpen} />
    </main>
  )
}
