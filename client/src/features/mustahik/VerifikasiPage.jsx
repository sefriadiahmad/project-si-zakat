import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Textarea,
  Label,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { UserCheck, XCircle, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { KATEGORI_ASNAF_LABELS } from '@shared/constants'

const rejectSchema = z.object({
  alasan_penolakan: z
    .string()
    .trim()
    .min(1, 'Alasan penolakan wajib diisi')
    .max(500, 'Alasan penolakan maksimal 500 karakter'),
})

export default function VerifikasiPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedMustahik, setSelectedMustahik] = useState(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mustahik', 'menunggu'],
    queryFn: async () => {
      const response = await api.get('/mustahik', {
        params: { status_verifikasi: 'menunggu', limit: 100 },
      })
      return response.data
    },
  })

  const verifikasiMutation = useMutation({
    mutationFn: async ({ id, action, alasan_penolakan }) => {
      const payload = {
        status_verifikasi: action === 'verify' ? 'terverifikasi' : 'ditolak',
        ...(action === 'reject' && { alasan_penolakan }),
      }
      const response = await api.patch(`/mustahik/${id}/verifikasi`, payload)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mustahik'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      const action = variables.action === 'verify' ? 'diverifikasi' : 'ditolak'
      toast({
        title: 'Status Berhasil Diperbarui',
        description: `Mustahik ${data.nama_kepala_keluarga} berhasil ${action}.`,
      })
      setRejectDialogOpen(false)
      setVerifyDialogOpen(false)
      setSelectedMustahik(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Status',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const handleVerify = () => {
    if (!selectedMustahik) return
    verifikasiMutation.mutate({ id: selectedMustahik.id, action: 'verify' })
  }

  const handleReject = (values) => {
    if (!selectedMustahik) return
    verifikasiMutation.mutate({ id: selectedMustahik.id, action: 'reject', alasan_penolakan: values.alasan_penolakan })
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verifikasi Mustahik</h1>
          <p className="text-sm text-slate-500">Tinjau dan verifikasi pendaftaran mustahik baru.</p>
        </div>
        <Link to="/mustahik">
          <Button variant="outline" className="gap-2 border-slate-200 hover:bg-white">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nama Kepala Keluarga</TableHead>
              <TableHead className="font-semibold text-slate-700">Kategori Asnaf</TableHead>
              <TableHead className="font-semibold text-slate-700">Tanggungan</TableHead>
              <TableHead className="font-semibold text-slate-700">Wilayah RT</TableHead>
              <TableHead className="font-semibold text-slate-700">Registrasi</TableHead>
              <TableHead className="w-[220px] font-semibold text-slate-700 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                  Memuat data mustahik menunggu verifikasi...
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
                  Tidak ada mustahik yang menunggu verifikasi.
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
                  <TableCell className="text-slate-600">{mustahik.jumlah_tanggungan} jiwa</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {mustahik.nama_rt || `RT ID: ${mustahik.wilayah_rt_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(mustahik.created_at)}</TableCell>
                  <TableCell className="flex justify-end gap-2 bg">
                    <Dialog open={verifyDialogOpen && selectedMustahik?.id === mustahik.id} onOpenChange={setVerifyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          onClick={() => setSelectedMustahik(mustahik)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Verifikasi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg sm:w-full bg-white rounded-lg shadow-lg border border-slate-200">
                        <DialogHeader>
                          <DialogTitle>Konfirmasi Verifikasi</DialogTitle>
                          <DialogDescription>
                            Apakah Anda yakin ingin memverifikasi mustahik <strong>{mustahik.nama_kepala_keluarga}</strong>?
                            Aksi ini tidak dapat dibatalkan.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" className="border-slate-200">Batal</Button>
                          </DialogClose>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleVerify}
                            disabled={verifikasiMutation.isPending}
                          >
                            {verifikasiMutation.isPending ? 'Memproses...' : 'Ya, Verifikasi'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={rejectDialogOpen && selectedMustahik?.id === mustahik.id} onOpenChange={setRejectDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:text-red-800 hover:bg-red-50"
                          onClick={() => setSelectedMustahik(mustahik)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg sm:w-full bg-white rounded-lg shadow-lg border border-slate-200">
                        <DialogHeader>
                          <DialogTitle>Konfirmasi Penolakan</DialogTitle>
                          <DialogDescription>
                            Berikan alasan penolakan untuk <strong>{mustahik.nama_kepala_keluarga}</strong>.
                          </DialogDescription>
                        </DialogHeader>
                        <RejectForm onSubmit={handleReject} isLoading={verifikasiMutation.isPending} onCancel={() => setRejectDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RejectForm({ onSubmit, isLoading, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      alasan_penolakan: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="alasan_penolakan" className="font-medium text-slate-700">Alasan Penolakan *</Label>
        <Textarea
          id="alasan_penolakan"
          placeholder="Jelaskan alasan penolakan..."
          className="min-h-[100px] bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
          {...register('alasan_penolakan')}
        />
        {errors.alasan_penolakan && (
          <p className="text-xs font-medium text-red-600">{errors.alasan_penolakan.message}</p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-200">
          Batal
        </Button>
        <Button type="submit" variant="destructive" disabled={isLoading}>
          {isLoading ? 'Memproses...' : 'Tolak Mustahik'}
        </Button>
      </DialogFooter>
    </form>
  )
}
