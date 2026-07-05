import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'admin_masjid'

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedAsnaf, setSelectedAsnaf] = useState('all')
  const [selectedRt, setSelectedRt] = useState('all')
  const [sortBy, setSortBy] = useState('tanggal')
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
    queryKey: ['mustahik', { search, selectedStatus, selectedAsnaf, selectedRt, sortBy, sortOrder, page }],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      }
      if (search.trim() !== '') params.search = search
      if (selectedStatus !== 'all') params.status_verifikasi = selectedStatus
      if (selectedAsnaf !== 'all') params.kategori_asnaf = selectedAsnaf
      if (selectedRt !== 'all') params.wilayah_rt_id = selectedRt

      const response = await api.get('/mustahik', { params })
      return response.data
    },
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Mustahik</h1>
          <p className="text-sm text-slate-500">Kelola data penerima zakat, infaq, dan sedekah.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/mustahik/verifikasi">
              <Button variant="outline" className="gap-2 border-slate-200 hover:bg-white">
                <UserCheck className="h-4 w-4" />
                Verifikasi
              </Button>
            </Link>
          )}
          <Link to="/mustahik/baru">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Tambah Mustahik
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama kepala keluarga..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200 w-[160px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="bg-slate-50/50 border-slate-200 w-[160px]">
                <SelectValue placeholder="Semua Asnaf" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="bg-slate-50/50 border-slate-200 w-[160px]">
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
                  Nama Kepala Keluarga
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Kategori Asnaf</TableHead>
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
              <TableHead className="font-semibold text-slate-700">Status Verifikasi</TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                  Memuat data mustahik...
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
                  Tidak ada data mustahik ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((mustahik) => (
                <TableRow key={mustahik.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{mustahik.nama_kepala_keluarga}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {KATEGORI_ASNAF_LABELS[mustahik.kategori_asnaf] || mustahik.kategori_asnaf}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {mustahik.nama_rt || `RT ID: ${mustahik.wilayah_rt_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(mustahik.created_at)}</TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass[mustahik.status_verifikasi] || 'bg-slate-100 text-slate-700 border-none'}>
                      {STATUS_VERIFIKASI_LABELS[mustahik.status_verifikasi] || mustahik.status_verifikasi}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && mustahik.status_verifikasi === 'menunggu' && (
                      <Link to={`/mustahik/${mustahik.id}/verifikasi`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.pagination && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/25">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {data.data.length} dari {data.pagination.total} Mustahik
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
