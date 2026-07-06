import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { Wallet, Wheat, Save } from 'lucide-react'
import { KATEGORI_ASNAF_LABELS } from '@shared/constants'

export default function DistribusiPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedMustahik, setSelectedMustahik] = useState('')
  const [nominal, setNominal] = useState('')
  const [beratKg, setBeratKg] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [tahunHijriah, setTahunHijriah] = useState(new Date().getFullYear())
  const [tahunMasehi, setTahunMasehi] = useState(new Date().getFullYear())

  const { data: kuotaData, isLoading, isError } = useQuery({
    queryKey: ['distribusi-kuota'],
    queryFn: async () => {
      const response = await api.get('/distribusi/kuota')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/zakat/keluar', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribusi-kuota'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Distribusi Berhasil Dicatat',
        description: 'Pencatatan pengeluaran distribusi berhasil disimpan.',
      })
      setSelectedMustahik('')
      setNominal('')
      setBeratKg('')
      setKeterangan('')
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Mencatat Distribusi',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedMustahik) {
      toast({
        variant: 'destructive',
        title: 'Validasi Gagal',
        description: 'Pilih mustahik penerima.',
      })
      return
    }

    createMutation.mutate({
      mustahik_id: Number(selectedMustahik),
      nominal: nominal ? Number(nominal) : 0,
      berat_kg: beratKg ? Number(beratKg) : 0,
      keterangan: keterangan || null,
      tahun_hijriah,
      tahun_masehi,
    })
  }

  const formatCurrency = (value) => {
    return `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`
  }

  const formatKg = (value) => {
    return `${(Number(value) || 0).toLocaleString('id-ID')} kg`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Distribusi Zakat</h1>
        <p className="text-sm text-slate-500">Kelola kuota dan pencatatan distribusi zakat, infaq, dan sedekah.</p>
      </div>

      {isLoading ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-6 text-center text-slate-500 font-medium">Memuat data distribusi...</CardContent>
        </Card>
      ) : isError ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-6 text-center text-red-600 font-medium">Gagal memuat data distribusi.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Kuota Uang per Jiwa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(kuotaData?.kuota_uang_per_jiwa)}</p>
                <p className="text-xs text-slate-500 mt-1">Total dana masuk: {formatCurrency(kuotaData?.total_uang_masuk)}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-emerald-600" />
                  Kuota Beras per Jiwa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-2xl font-bold text-slate-900">{formatKg(kuotaData?.kuota_beras_per_jiwa)}</p>
                <p className="text-xs text-slate-500 mt-1">Total beras masuk: {formatKg(kuotaData?.total_beras_masuk)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900">Rekomendasi Distribusi per Mustahik</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Nama Kepala Keluarga</TableHead>
                    <TableHead className="font-semibold text-slate-700">Kategori Asnaf</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Tanggungan</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Rekomendasi Uang</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Rekomendasi Beras</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kuotaData?.rekomendasi?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        Belum ada mustahik terverifikasi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kuotaData?.rekomendasi?.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{item.nama_kepala_keluarga}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">{item.jumlah_tanggungan} jiwa</TableCell>
                        <TableCell className="text-right text-slate-700">{formatCurrency(item.rekomendasi_uang)}</TableCell>
                        <TableCell className="text-right text-slate-700">{formatKg(item.rekomendasi_beras)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900">Catat Pengeluaran Distribusi</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Mustahik Penerima *</Label>
                    <Select value={selectedMustahik} onValueChange={setSelectedMustahik}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Pilih mustahik..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kuotaData?.rekomendasi?.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.nama_kepala_keluarga} - {KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Nominal (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      className="bg-white border-slate-200"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Beras (kg)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={beratKg}
                      onChange={(e) => setBeratKg(e.target.value)}
                      className="bg-white border-slate-200"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Keterangan</Label>
                    <Textarea
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="bg-white border-slate-200 min-h-[80px]"
                      placeholder="Opsional..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Tahun Hijriah</Label>
                    <Input
                      type="number"
                      min={1400}
                      max={1500}
                      value={tahunHijriah}
                      onChange={(e) => setTahunHijriah(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">Tahun Masehi</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={tahunMasehi}
                      onChange={(e) => setTahunMasehi(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
