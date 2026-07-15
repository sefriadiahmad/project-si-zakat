import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Button,
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Verifikasi Mustahik</h1>
          <p className="text-xs sm:text-sm text-slate-500">Tinjau dan verifikasi pendaftaran mustahik baru.</p>
        </div>
        <Link to="/mustahik">
          <Button variant="outline" className="gap-1.5 sm:gap-2 border-slate-200 hover:bg-white text-xs sm:text-sm w-full sm:w-auto">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:inline">Kembali ke Daftar</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
        {/* Kontainer Horizontal Scroll - hanya untuk tabel */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="min-w-[150px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Nama Kepala Keluarga</th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Kategori Asnaf</th>
                <th className="min-w-[60px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Tanggungan</th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Wilayah RT</th>
                <th className="min-w-[80px] px-3 py-2.5 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Registrasi</th>
                <th className="min-w-[100px] px-3 py-2.5 text-right text-xs font-semibold text-slate-700 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-slate-500 font-medium text-xs px-3 py-3">
                    Memuat data mustahik menunggu verifikasi...
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
                    Tidak ada mustahik yang menunggu verifikasi.
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
                    <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">{mustahik.jumlah_tanggungan} jiwa</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-700 border border-slate-200 rounded whitespace-nowrap">
                        {mustahik.nama_rt || `RT ${mustahik.wilayah_rt_id}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(mustahik.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog open={verifyDialogOpen && selectedMustahik?.id === mustahik.id} onOpenChange={setVerifyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 px-2 text-[10px]"
                              onClick={() => setSelectedMustahik(mustahik)}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Verif
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg bg-white rounded-lg shadow-lg border border-slate-200">
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
                              className="text-red-700 hover:text-red-800 hover:bg-red-50 h-7 px-2 text-[10px]"
                              onClick={() => setSelectedMustahik(mustahik)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Tolak
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg bg-white rounded-lg shadow-lg border border-slate-200">
                            <DialogHeader>
                              <DialogTitle>Konfirmasi Penolakan</DialogTitle>
                              <DialogDescription>
                                Berikan alasan penolakan untuk <strong>{mustahik.nama_kepala_keluarga}</strong>.
                              </DialogDescription>
                            </DialogHeader>
                            <RejectForm onSubmit={handleReject} isLoading={verifikasiMutation.isPending} onCancel={() => setRejectDialogOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          className="min-h-[80px] sm:min-h-[100px] bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200 text-sm"
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
