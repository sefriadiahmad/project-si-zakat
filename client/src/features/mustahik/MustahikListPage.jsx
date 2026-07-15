import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { useAuth } from '@features/auth/AuthContext'
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { Plus, Search, ArrowUpDown, UserCheck } from 'lucide-react'
import {
  STATUS_VERIFIKASI,
  STATUS_VERIFIKASI_LABELS,
  KATEGORI_ASNAF,
  KATEGORI_ASNAF_LABELS,
} from '@shared/constants'

const statusBadgeClass = {
  menunggu: 'bg-amber-50 text-amber-700 border-none',
  terverifikasi: 'bg-emerald-50 text-emerald-700 border-none',
  ditolak: 'bg-red-50 text-red-700 border-none',
}

export default function MustahikListPage() {
  const { user } = useAuth()
  // eslint-disable-next-line no-unused-vars
  const _toast = useToast()
  const isAdmin = user?.role === 'admin_masjid'

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedAsnaf, setSelectedAsnaf] = useState('all')
  const [selectedRt, setSelectedRt] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: rtList = [] } = useQuery({
    queryKey: ['wilayah-rt'],
    queryFn: async () => {
      const response = await api.get('/wilayah-rt')
      return response.data
    },
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mustahik', search, selectedStatus, selectedAsnaf, selectedRt, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      }
      if (search.trim()) params.search = search.trim()
      if (selectedStatus !== 'all') params.status_verifikasi = selectedStatus
      if (selectedAsnaf !== 'all') params.kategori_asnaf = selectedAsnaf
      if (selectedRt !== 'all') params.wilayah_rt_id = selectedRt

      const response = await api.get('/mustahik', { params })
      return response.data
    },
    refetchOnWindowFocus: true,
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Manajemen Mustahik</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola data penerima zakat, infaq, dan sedekah.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/mustahik/verifikasi">
              <Button variant="outline" className="gap-1.5 sm:gap-2 border-slate-200 hover:bg-white text-xs sm:text-sm">
                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Verifikasi</span>
              </Button>
            </Link>
          )}
          <Link to="/mustahik/baru">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tambah Mustahik</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari nama kepala keluarga..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 h-10"
              />
            </div>
          </div>

          {/* Filter Selects - Wrap on mobile */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 w-auto min-w-[120px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_VERIFIKASI.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_VERIFIKASI_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAsnaf}
              onValueChange={(val) => {
                setSelectedAsnaf(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 w-auto min-w-[120px]">
                <SelectValue placeholder="Semua Asnaf" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
                <SelectItem value="all">Semua Asnaf</SelectItem>
                {KATEGORI_ASNAF.map((asnaf) => (
                  <SelectItem key={asnaf} value={asnaf}>
                    {KATEGORI_ASNAF_LABELS[asnaf]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedRt}
              onValueChange={(val) => {
                setSelectedRt(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200 h-10 w-auto min-w-[120px]">
                <SelectValue placeholder="Semua RT" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
                <SelectItem value="all">Semua Wilayah RT</SelectItem>
                {rtList.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id.toString()}>
                    {rt.nama_rt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
        {/* Kontainer Horizontal Scroll - hanya untuk tabel */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="min-w-[150px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('nama')}
                    className="hover:text-emerald-600 flex items-center gap-1"
                  >
                    Nama Kepala Keluarga
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Kategori Asnaf</th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('rt')}
                    className="hover:text-emerald-600 flex items-center gap-1"
                  >
                    Wilayah RT
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="hover:text-emerald-600 flex items-center gap-1"
                  >
                    Registrasi
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-slate-500 font-medium text-xs px-3 py-3">
                    Memuat data mustahik...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-red-500 font-medium text-xs px-3 py-3">
                    Gagal memuat data dari server.
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-slate-500 text-xs px-3 py-3">
                    Tidak ada data mustahik ditemukan.
                  </td>
                </tr>
              ) : (
                data?.data?.map((mustahik) => (
                  <tr key={mustahik.id} className="hover:bg-slate-50/50 transition-colors border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 text-xs">
                      <span className="block truncate max-w-[130px]">{mustahik.nama_kepala_keluarga}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-700 border border-slate-200 rounded whitespace-nowrap">
                        {KATEGORI_ASNAF_LABELS[mustahik.kategori_asnaf] || mustahik.kategori_asnaf}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-700 border border-slate-200 rounded whitespace-nowrap">
                        {mustahik.nama_rt || `RT ${mustahik.wilayah_rt_id}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(mustahik.created_at)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap ${
                        statusBadgeClass[mustahik.status_verifikasi] || 'bg-slate-100 text-slate-700'
                      }`}>
                        {STATUS_VERIFIKASI_LABELS[mustahik.status_verifikasi] || mustahik.status_verifikasi}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50/25">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">
              {data.data.length} dari {data.pagination.total}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 sm:h-8 border-slate-200 hover:bg-white text-[10px] sm:text-xs font-medium px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Sebelumnya</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-700 px-1.5 sm:px-2">
                {page}/{data.pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="h-7 sm:h-8 border-slate-200 hover:bg-white text-[10px] sm:text-xs font-medium px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
