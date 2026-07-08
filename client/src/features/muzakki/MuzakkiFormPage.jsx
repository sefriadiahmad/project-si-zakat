import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
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
  Textarea,
  Button,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { ArrowLeft, Save } from 'lucide-react'

const muzakkiFormSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(150, 'Nama lengkap maksimal 150 karakter'),
  no_telepon: z
    .string()
    .trim()
    .min(1, 'Nomor telepon wajib diisi')
    .max(20, 'Nomor telepon maksimal 20 karakter'),
  wilayah_rt_id: z.string().min(1, 'Wilayah RT wajib diisi'),
  alamat_detail: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
})

export default function MuzakkiFormPage() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch Wilayah RT list for the dropdown
  const { data: rtList = [] } = useQuery({
    queryKey: ['wilayah-rt'],
    queryFn: async () => {
      const response = await api.get('/wilayah-rt')
      return response.data
    },
  })

  // Fetch Muzakki details if editing
  const { data: muzakkiData, isLoading: isLoadingMuzakki } = useQuery({
    queryKey: ['muzakki', id],
    queryFn: async () => {
      const response = await api.get(`/muzakki/${id}`)
      return response.data
    },
    enabled: isEditMode,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(muzakkiFormSchema),
    defaultValues: {
      nama_lengkap: '',
      no_telepon: '',
      wilayah_rt_id: '',
      alamat_detail: '',
      catatan: '',
    },
  })

  // Autofill form when data is loaded
  useEffect(() => {
    if (muzakkiData) {
      reset({
        nama_lengkap: muzakkiData.nama_lengkap || '',
        no_telepon: muzakkiData.no_telepon || '',
        wilayah_rt_id: muzakkiData.wilayah_rt_id ? muzakkiData.wilayah_rt_id.toString() : '',
        alamat_detail: muzakkiData.alamat_detail || '',
        catatan: muzakkiData.catatan || '',
      })
    }
  }, [muzakkiData, reset])

  // Mutation for creating/updating Muzakki
  const submitMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        wilayah_rt_id: parseInt(values.wilayah_rt_id, 10),
      }
      if (isEditMode) {
        const response = await api.put(`/muzakki/${id}`, payload)
        return response.data
      } else {
        const response = await api.post('/muzakki', payload)
        return response.data
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['muzakki'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: isEditMode ? 'Muzakki Berhasil Diperbarui' : 'Muzakki Berhasil Terdaftar',
        description: `Muzakki ${data.nama_lengkap} berhasil disimpan.`,
      })
      navigate('/muzakki')
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Data',
        description: error.response?.data?.message || 'Nomor telepon mungkin sudah digunakan.',
      })
    },
  })

  const onSubmit = (values) => {
    submitMutation.mutate(values)
  }

  if (isEditMode && isLoadingMuzakki) {
    return <div className="text-center py-12 text-slate-500 font-medium">Memuat data muzakki...</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back Button */}
      <Link to="/muzakki" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Muzakki
      </Link>

      <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">
            {isEditMode ? 'Edit Profil Muzakki' : 'Registrasi Muzakki Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form id="muzakki-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <Label htmlFor="nama_lengkap" className="font-medium text-slate-700">Nama Lengkap *</Label>
              <Input
                id="nama_lengkap"
                placeholder="Masukkan nama lengkap muzakki"
                className="bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                maxLength={150}
                {...register('nama_lengkap')}
              />
              {errors.nama_lengkap && (
                <p className="text-xs font-medium text-red-600">{errors.nama_lengkap.message}</p>
              )}
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-2">
              <Label htmlFor="no_telepon" className="font-medium text-slate-700">Nomor Telepon / WA *</Label>
              <Input
                id="no_telepon"
                placeholder="Contoh: 08123456789"
                className="bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                maxLength={20}
                {...register('no_telepon')}
              />
              {errors.no_telepon && (
                <p className="text-xs font-medium text-red-600">{errors.no_telepon.message}</p>
              )}
            </div>

            {/* Wilayah RT */}
            <div className="space-y-2">
              <Label htmlFor="wilayah_rt_id" className="font-medium text-slate-700">Wilayah Rukun Tetangga (RT) *</Label>
              <Controller
                name="wilayah_rt_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-50/25 focus:ring-emerald-500 border-slate-200">
                      <SelectValue placeholder="Pilih wilayah RT..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
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

            {/* Alamat Detail */}
            <div className="space-y-2">
              <Label htmlFor="alamat_detail" className="font-medium text-slate-700">Alamat Lengkap</Label>
              <Textarea
                id="alamat_detail"
                placeholder="Masukkan alamat rumah detail..."
                className="min-h-[80px] bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                {...register('alamat_detail')}
              />
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="catatan" className="font-medium text-slate-700">Catatan Khusus</Label>
              <Textarea
                id="catatan"
                placeholder="Catatan tambahan (opsional)..."
                className="min-h-[60px] bg-slate-50/25 focus-visible:ring-emerald-500 border-slate-200"
                {...register('catatan')}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between p-6">
          <Link to="/muzakki">
            <Button variant="outline" type="button" className="border-slate-200 hover:bg-white">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            form="muzakki-form"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            disabled={submitMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {submitMutation.isPending ? 'Menyimpan...' : 'Simpan Muzakki'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
