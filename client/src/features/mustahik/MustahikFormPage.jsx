import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import api from '@shared/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { KATEGORI_ASNAF, KATEGORI_ASNAF_LABELS, UPLOAD_CONFIG } from '@shared/constants'

const mustahikFormSchema = z.object({
  nama_kepala_keluarga: z
    .string()
    .trim()
    .min(1, 'Nama kepala keluarga wajib diisi')
    .max(150, 'Nama kepala keluarga maksimal 150 karakter'),
  wilayah_rt_id: z.string().min(1, 'Wilayah RT wajib diisi'),
  kategori_asnaf: z.enum(KATEGORI_ASNAF, {
    errorMap: () => ({ message: 'Kategori asnaf tidak valid' }),
  }),
  jumlah_tanggungan: z.coerce
    .number({ invalid_type_error: 'Jumlah tanggungan wajib diisi' })
    .int()
    .min(1, 'Jumlah tanggungan minimal 1')
    .max(99, 'Jumlah tanggungan maksimal 99'),
})

export default function MustahikFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: rtList = [] } = useQuery({
    queryKey: ['wilayah-rt'],
    queryFn: async () => {
      const response = await api.get('/wilayah-rt')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mustahikFormSchema),
    defaultValues: {
      nama_kepala_keluarga: '',
      wilayah_rt_id: '',
      kategori_asnaf: 'fakir',
      jumlah_tanggungan: 1,
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData()
      formData.append('nama_kepala_keluarga', values.nama_kepala_keluarga)
      formData.append('wilayah_rt_id', values.wilayah_rt_id)
      formData.append('kategori_asnaf', values.kategori_asnaf)
      formData.append('jumlah_tanggungan', values.jumlah_tanggungan)

      const fileInput = document.getElementById('dokumen-mustahik')
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('dokumen', fileInput.files[0])
      }

      const response = await api.post('/mustahik', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mustahik'] })
      toast({
        title: 'Mustahik Berhasil Terdaftar',
        description: `Mustahik ${data.nama_kepala_keluarga} berhasil disimpan dengan status menunggu verifikasi.`,
      })
      navigate('/mustahik')
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Data',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const onSubmit = (values) => {
    submitMutation.mutate(values)
  }

  const allowedExtensions = useMemo(
    () => UPLOAD_CONFIG.ALLOWED_EXTENSIONS.map((ext) => ext.startsWith('.') ? ext : `.${ext}`),
    []
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/mustahik" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Mustahik
      </Link>

      <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Pendaftaran Mustahik Baru</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form id="mustahik-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nama_kepala_keluarga" className="font-medium text-slate-700">Nama Kepala Keluarga *</Label>
              <Input
                id="nama_kepala_keluarga"
                placeholder="Masukkan nama kepala keluarga"
                className="bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                maxLength={150}
                {...register('nama_kepala_keluarga')}
              />
              {errors.nama_kepala_keluarga && (
                <p className="text-xs font-medium text-red-600">{errors.nama_kepala_keluarga.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wilayah_rt_id" className="font-medium text-slate-700">Wilayah RT *</Label>
              <Controller
                name="wilayah_rt_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-50/25 focus:ring-emerald-500 border-slate-200">
                      <SelectValue placeholder="Pilih wilayah RT..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rtList.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id.toString()}>
                          {rt.nama_rt} - {rt.keterangan || 'Tanpa Keterangan'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.wilayah_rt_id && (
                <p className="text-xs font-medium text-red-600">{errors.wilayah_rt_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori_asnaf" className="font-medium text-slate-700">Kategori Asnaf *</Label>
              <Controller
                name="kategori_asnaf"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-50/25 focus:ring-emerald-500 border-slate-200">
                      <SelectValue placeholder="Pilih kategori asnaf..." />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_ASNAF.map((asnaf) => (
                        <SelectItem key={asnaf} value={asnaf}>
                          {KATEGORI_ASNAF_LABELS[asnaf]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.kategori_asnaf && (
                <p className="text-xs font-medium text-red-600">{errors.kategori_asnaf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah_tanggungan" className="font-medium text-slate-700">Jumlah Tanggungan *</Label>
              <Input
                id="jumlah_tanggungan"
                type="number"
                min={1}
                max={99}
                placeholder="Contoh: 4"
                className="bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                {...register('jumlah_tanggungan')}
              />
              {errors.jumlah_tanggungan && (
                <p className="text-xs font-medium text-red-600">{errors.jumlah_tanggungan.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dokumen-mustahik" className="font-medium text-slate-700">
                Dokumen Pendukung (Opsional)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="dokumen-mustahik"
                  type="file"
                  accept={allowedExtensions.join(',')}
                  className="bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                />
                <Upload className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Maksimal {UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB. Format: {UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ').toUpperCase()}
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between p-6">
          <Link to="/mustahik">
            <Button variant="outline" type="button" className="border-slate-200 hover:bg-white">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            form="mustahik-form"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            disabled={submitMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {submitMutation.isPending ? 'Menyimpan...' : 'Simpan Mustahik'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
