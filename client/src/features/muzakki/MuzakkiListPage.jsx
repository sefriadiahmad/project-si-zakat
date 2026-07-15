import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Plus, Search, ArrowUpDown, Edit } from 'lucide-react'

export default function MuzakkiListPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State filters & pagination
  const [search, setSearch] = useState('')
  const [selectedRt, setSelectedRt] = useState('all')
  const [sortBy, setSortBy] = useState('nama')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const limit = 10

  const isAdmin = user?.role === 'admin_masjid'

  // Fetch Wilayah RT for filtering
  const { data: rtList = [] } = useQuery({
    queryKey: ['wilayah-rt'],
    queryFn: async () => {
      const response = await api.get('/wilayah-rt')
      return response.data
    },
  })

  // Fetch Muzakki List
  const { data, isLoading, isError } = useQuery({
    queryKey: ['muzakki', { search, selectedRt, sortBy, sortOrder, page }],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      }
      if (search.trim() !== '') params.search = search
      if (selectedRt !== 'all') params.wilayah_rt_id = selectedRt

      const response = await api.get('/muzakki', { params })
      return response.data
    },
  })

  // Mutation for toggle active status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await api.patch(`/muzakki/${id}/status`, { is_active })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['muzakki'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Status Berhasil Diperbarui',
        description: `Muzakki ${data.nama_lengkap} kini ${data.is_active ? 'aktif' : 'nonaktif'}.`,
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Status',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const handleToggleStatus = (id, currentStatus) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus })
  }

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
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full overflow-hidden">
      {/* Header Halaman */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Manajemen Muzakki</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola data pembayar zakat, infaq, dan sedekah.</p>
        </div>
        <Link to="/muzakki/baru">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tambah Muzakki</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </Link>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nama atau telepon..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 h-10"
              />
            </div>
          </div>

          {/* RT Filter */}
          <div className="w-full sm:w-[160px] lg:w-[200px]">
            <Select
              value={selectedRt}
              onValueChange={(val) => {
                setSelectedRt(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 h-10">
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

      {/* Tabel Data Muzakki */}
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
                    Nama Lengkap
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="min-w-[90px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Telepon</th>
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
                    onClick={() => handleSort('tanggal')}
                    className="hover:text-emerald-600 flex items-center gap-1"
                  >
                    Registrasi
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="min-w-[60px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Status</th>
                <th className="min-w-[50px] px-3 py-2.5 text-right text-xs font-semibold text-slate-700 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-slate-500 font-medium text-xs px-3 py-3">
                    Memuat data muzakki...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-red-500 font-medium text-xs px-3 py-3">
                    Gagal memuat data dari server.
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-slate-500 text-xs px-3 py-3">
                    Tidak ada data muzakki ditemukan.
                  </td>
                </tr>
              ) : (
                data?.data?.map((muzakki) => (
                  <tr key={muzakki.id} className="hover:bg-slate-50/50 transition-colors border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900 text-xs">
                      <span className="block truncate max-w-[120px]">{muzakki.nama_lengkap}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-mono text-xs whitespace-nowrap">{muzakki.no_telepon}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-700 border border-slate-200 rounded whitespace-nowrap">
                        {muzakki.nama_rt || `RT ${muzakki.wilayah_rt_id}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(muzakki.created_at)}</td>
                    <td className="px-3 py-2">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(muzakki.id, muzakki.is_active)}
                            disabled={toggleStatusMutation.isPending}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                              muzakki.is_active ? 'bg-emerald-400' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                              muzakki.is_active ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                          <span className={`text-[10px] font-semibold whitespace-nowrap ${muzakki.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {muzakki.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap ${
                          muzakki.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {muzakki.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link to={`/muzakki/${muzakki.id}/edit`}>
                        <button className="inline-flex items-center justify-center h-6 w-6 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
