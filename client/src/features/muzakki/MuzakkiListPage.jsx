import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { useAuth } from '@features/auth/AuthContext'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  Badge,
  Switch,
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
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Muzakki</h1>
          <p className="text-sm text-slate-500">Kelola data pembayar zakat, infaq, dan sedekah.</p>
        </div>
        <Link to="/muzakki/baru">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Tambah Muzakki
          </Button>
        </Link>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama atau nomor telepon..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>

          {/* RT Filter */}
          <div className="w-full sm:w-[200px]">
            <Select
              value={selectedRt}
              onValueChange={(val) => {
                setSelectedRt(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200">
                <SelectValue placeholder="Semua RT" />
              </SelectTrigger>
              <SelectContent>
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow>
              <TableHead className="w-[250px] font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('nama')}
                  className="hover:bg-slate-100/50 hover:text-slate-900 gap-1.5 p-0 font-semibold"
                >
                  Nama Lengkap
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Nomor Telepon</TableHead>
              <TableHead className="font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('rt')}
                  className="hover:bg-slate-100/50 hover:text-slate-900 gap-1.5 p-0 font-semibold"
                >
                  Wilayah RT
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('tanggal')}
                  className="hover:bg-slate-100/50 hover:text-slate-900 gap-1.5 p-0 font-semibold"
                >
                  Registrasi
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                  Memuat data muzakki...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-red-500 font-medium">
                  Gagal memuat data dari server.
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Tidak ada data muzakki ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((muzakki) => (
                <TableRow key={muzakki.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{muzakki.nama_lengkap}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{muzakki.no_telepon}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {muzakki.nama_rt || `RT ID: ${muzakki.wilayah_rt_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(muzakki.created_at)}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={muzakki.is_active}
                          onCheckedChange={() => handleToggleStatus(muzakki.id, muzakki.is_active)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className={`text-xs font-semibold ${muzakki.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {muzakki.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        className={
                          muzakki.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-none'
                            : 'bg-slate-100 text-slate-500 border-none'
                        }
                      >
                        {muzakki.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/muzakki/${muzakki.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {data && data.pagination && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/25">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {data.data.length} dari {data.pagination.total} Muzakki
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 border-slate-200 hover:bg-white text-xs font-medium"
              >
                Sebelumnya
              </Button>
              <span className="text-xs font-semibold text-slate-700 px-2">
                Halaman {page} dari {data.pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="h-8 border-slate-200 hover:bg-white text-xs font-medium"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
