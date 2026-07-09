/* eslint-disable react-hooks/static-components */
import { useState, useMemo } from 'react'
import { ArrowUpDown, MapPin, Users, UserCheck, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/card'
import { Input } from '@shared/components/input'
import { Label } from '@shared/components/label'
import { Button } from '@shared/components/button'
import { Skeleton } from '@shared/components/skeleton'
import { useDemografiData, formatCurrency, } from './useDemografiData'

export default function DemografiPage() {
  const [tahunHijriah, setTahunHijriah] = useState('')
  const [tahunMasehi, setTahunMasehi] = useState('')
  const [sortField, setSortField] = useState('nama_rt')
  const [sortDirection, setSortDirection] = useState('asc')

  const filter = useMemo(() => {
    const params = {}
    if (tahunHijriah) params.tahun_hijriah = tahunHijriah
    if (tahunMasehi) params.tahun_masehi = tahunMasehi
    return params
  }, [tahunHijriah, tahunMasehi])

  const { data: demografiData, isLoading, isError } = useDemografiData(filter)

  // Sort data
  const sortedData = useMemo(() => {
    if (!demografiData) return []

    return [...demografiData].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle "N/A" for rasio
      if (sortField === 'rasio_muzakki_mustahik') {
        aVal = aVal === 'N/A' ? -1 : Number(aVal)
        bVal = bVal === 'N/A' ? -1 : Number(bVal)
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })
  }, [demografiData, sortField, sortDirection])

  // Calculate totals for summary
  const totals = useMemo(() => {
    if (!demografiData || demografiData.length === 0) {
      return {
        totalMuzakki: 0,
        totalMustahik: 0,
        totalDanaMasuk: 0,
        totalDanaKeluar: 0,
      }
    }

    return demografiData.reduce(
      (acc, rt) => ({
        totalMuzakki: acc.totalMuzakki + rt.jumlah_muzakki_aktif,
        totalMustahik: acc.totalMustahik + rt.jumlah_mustahik_terverifikasi,
        totalDanaMasuk: acc.totalDanaMasuk + rt.total_dana_masuk,
        totalDanaKeluar: acc.totalDanaKeluar + rt.total_dana_keluar,
      }),
      { totalMuzakki: 0, totalMustahik: 0, totalDanaMasuk: 0, totalDanaKeluar: 0 }
    )
  }, [demografiData])

  // Chart data for muzakki per RT
  const muzakkiChartData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return []
    return sortedData.map((rt) => ({
      nama_rt: rt.nama_rt,
      muzakki: rt.jumlah_muzakki_aktif,
      mustahik: rt.jumlah_mustahik_terverifikasi,
    }))
  }, [sortedData])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />
    }
    return (
      <ArrowUpDown
        className={`h-4 w-4 ${sortDirection === 'asc' ? 'text-emerald-600' : 'text-emerald-600 transform rotate-180'}`}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <MapPin className="h-4 w-4" />
            Pemetaan Demografi
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            Demografi per Wilayah RT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat persebaran muzakki dan mustahik per wilayah RT
          </p>
        </header>

        {/* Filter Card */}
        <Card className="rounded-xl border border-slate-200/80 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
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
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Muzakki Aktif</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {totals.totalMuzakki.toLocaleString('id-ID')}
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
                    <p className="text-sm font-medium text-slate-600">Total Mustahik Terverifikasi</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {totals.totalMustahik.toLocaleString('id-ID')}
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
                    <p className="text-sm font-medium text-slate-600">Total Dana Masuk</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {formatCurrency(totals.totalDanaMasuk)}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Dana Keluar</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {formatCurrency(totals.totalDanaKeluar)}
                    </p>
                  </div>
                  <TrendingDown className="h-10 w-10 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="rounded-xl border border-red-200 bg-red-50 shadow-sm mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-red-700">
                Gagal memuat data demografi. Silakan coba lagi.
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

        {/* Charts Row */}
        {!isLoading && !isError && sortedData.length > 0 && (
          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Bar Chart - Muzakki per RT */}
            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Perbandingan Muzakki dan Mustahik per RT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={muzakkiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nama_rt" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value, name) => [value, name === 'muzakki' ? 'Muzakki' : 'Mustahik']}
                      />
                      <Legend />
                      <Bar dataKey="muzakki" name="Muzakki" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="mustahik" name="Mustahik" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Demografi Table */}
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">
              Tabel Demografi per Wilayah RT
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort('nama_rt')}
                      >
                        Wilayah RT
                        <SortIcon field="nama_rt" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 tracking-wider">
                      <button
                        className="flex items-center gap-1 mx-auto hover:text-slate-900"
                        onClick={() => handleSort('jumlah_muzakki_aktif')}
                      >
                        Muzakki Aktif
                        <SortIcon field="jumlah_muzakki_aktif" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 tracking-wider">
                      <button
                        className="flex items-center gap-1 mx-auto hover:text-slate-900"
                        onClick={() => handleSort('jumlah_mustahik_terverifikasi')}
                      >
                        Mustahik Terverifikasi
                        <SortIcon field="jumlah_mustahik_terverifikasi" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 tracking-wider">
                      <button
                        className="flex items-center gap-1 ml-auto hover:text-slate-900"
                        onClick={() => handleSort('total_dana_masuk')}
                      >
                        Total Dana Masuk
                        <SortIcon field="total_dana_masuk" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 tracking-wider">
                      <button
                        className="flex items-center gap-1 ml-auto hover:text-slate-900"
                        onClick={() => handleSort('total_dana_keluar')}
                      >
                        Total Dana Keluar
                        <SortIcon field="total_dana_keluar" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        Tidak ada data demografi. Pastikan sudah ada data muzakki dan mustahik.
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((rt) => (
                      <tr key={rt.rt_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium text-slate-900">{rt.nama_rt}</span>
                          </div>
                          {rt.keterangan && (
                            <p className="text-xs text-slate-500 mt-0.5">{rt.keterangan}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                            {rt.jumlah_muzakki_aktif}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            {rt.jumlah_mustahik_terverifikasi}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(rt.total_dana_masuk)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(rt.total_dana_keluar)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
