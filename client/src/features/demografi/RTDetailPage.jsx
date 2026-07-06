import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, UserCheck, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/card'
import { Input } from '@shared/components/input'
import { Label } from '@shared/components/label'
import { Button } from '@shared/components/button'
import { Skeleton } from '@shared/components/skeleton'
import { useDemografiRTDetail, formatCurrency, formatKg, ASNRAF_COLORS } from './useDemografiData'

export default function RTDetailPage() {
  const { rtId } = useParams()
  const navigate = useNavigate()
  const [tahunHijriah, setTahunHijriah] = useState('')
  const [tahunMasehi, setTahunMasehi] = useState('')

  const filter = useMemo(() => {
    const params = {}
    if (tahunHijriah) params.tahun_hijriah = tahunHijriah
    if (tahunMasehi) params.tahun_masehi = tahunMasehi
    return params
  }, [tahunHijriah, tahunMasehi])

  const { data: rtDetail, isLoading, isError, error } = useDemografiRTDetail(rtId, filter)

  // Prepare pie chart data for asnaf breakdown
  const asnafChartData = useMemo(() => {
    if (!rtDetail?.mustahik?.breakdown_per_asnaf) return []
    return rtDetail.mustahik.breakdown_per_asnaf.map((item) => ({
      name: KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf,
      value: item.jumlah_keluarga,
      tanggungan: item.total_tanggungan,
      kategori: item.kategori_asnaf,
    }))
  }, [rtDetail])

  const totalAsnaf = useMemo(() => {
    return asnafChartData.reduce((sum, item) => sum + item.value, 0)
  }, [asnafChartData])

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back Button & Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/demografi')}
            className="mb-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Demografi
          </Button>

          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <MapPin className="h-4 w-4" />
            Detail Wilayah RT
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-48 mt-1" />
          ) : (
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">
              {rtDetail?.nama_rt || 'Wilayah RT'}
            </h1>
          )}
          {rtDetail?.keterangan && (
            <p className="text-sm text-slate-500 mt-1">{rtDetail.keterangan}</p>
          )}
        </div>

        {/* Filter Card */}
        <Card className="rounded-xl border border-slate-200/80 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <p className="text-sm text-slate-600">Filter Periode</p>
              </div>
              <div className="flex gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tahunHijriah" className="text-xs font-medium text-slate-700">
                    Tahun Hijriah
                  </Label>
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
                  <Label htmlFor="tahunMasehi" className="text-xs font-medium text-slate-700">
                    Tahun Masehi
                  </Label>
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
              {(tahunHijriah || tahunMasehi) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTahunHijriah('')
                    setTahunMasehi('')
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !isError && rtDetail ? (
          <>
            {/* Muzakki & Mustahik Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Muzakki Aktif</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {rtDetail.muzakki.jumlah_muzakki_aktif.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Keluarga Mustahik</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {rtDetail.mustahik.total_keluarga.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <UserCheck className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Tanggungan</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {rtDetail.mustahik.total_tanggungan.toLocaleString('id-ID')} jiwa
                      </p>
                    </div>
                    <UserCheck className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Transaksi Masuk</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {rtDetail.zakat_masuk.jumlah_transaksi}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dana Masuk & Keluar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card className="rounded-xl border border-emerald-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-emerald-100 p-3">
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Dana Masuk</p>
                      <p className="text-xl font-bold text-emerald-700 mt-1">
                        {formatCurrency(rtDetail.zakat_masuk.total_dana)}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatKg(rtDetail.zakat_masuk.total_beras)} Beras
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-red-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3">
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Dana Keluar (Distribusi)</p>
                      <p className="text-xl font-bold text-red-700 mt-1">
                        {formatCurrency(rtDetail.zakat_keluar.total_dana)}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatKg(rtDetail.zakat_keluar.total_beras)} Beras
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asnaf Breakdown */}
            <Card className="rounded-xl border border-slate-200/80 shadow-sm mb-6">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Breakdown Mustahik per Kategori Asnaf
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {asnafChartData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={asnafChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {asnafChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={ASNRAF_COLORS[entry.kategori] || '#10b981'}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            formatter={(value, name, props) => [
                              `${value} keluarga (${props.payload.tanggungan} jiwa)`,
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600 tracking-wider">
                              Kategori Asnaf
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-slate-600 tracking-wider">
                              Keluarga
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-slate-600 tracking-wider">
                              Tanggungan
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600 tracking-wider">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
{asnafChartData.map((item) => (
                             <tr key={item.kategori} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: ASNRAF_COLORS[item.kategori] || '#10b981' }}
                                  />
                                  <span className="text-sm font-medium text-slate-900">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center text-sm text-slate-700">
                                {item.value}
                              </td>
                              <td className="px-3 py-2 text-center text-sm text-slate-700">
                                {item.tanggungan} jiwa
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-slate-700">
                                {totalAsnaf > 0 ? ((item.value / totalAsnaf) * 100).toFixed(1) : 0}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td className="px-3 py-2 text-sm font-semibold text-slate-900">Total</td>
                            <td className="px-3 py-2 text-center text-sm font-semibold text-slate-900">
                              {totalAsnaf}
                            </td>
                            <td className="px-3 py-2 text-center text-sm font-semibold text-slate-900">
                              {rtDetail.mustahik.total_tanggungan} jiwa
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                              100%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Belum ada mustahik terverifikasi di wilayah ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter Info */}
            {(tahunHijriah || tahunMasehi) && (
              <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-slate-50/50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-600">
                    Menampilkan data untuk{' '}
                    {tahunHijriah && <span className="font-medium">Tahun Hijriah {tahunHijriah}</span>}
                    {tahunHijriah && tahunMasehi && ' dan '}
                    {tahunMasehi && <span className="font-medium">Tahun Masehi {tahunMasehi}</span>}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}

        {/* Error State */}
        {isError && (
          <Card className="rounded-xl border border-red-200 bg-red-50 shadow-sm mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-red-700">
                {error?.response?.data?.message || 'Gagal memuat detail RT. Silakan coba lagi.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/demografi')}
                className="mt-3 border-red-200 hover:bg-white"
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
