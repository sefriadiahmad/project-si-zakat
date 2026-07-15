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
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@shared/components'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/dialog'
import { useToast } from '@shared/components/toaster'
import { Wallet, Wheat, Save, AlertCircle } from 'lucide-react'
import { KATEGORI_ASNAF_LABELS } from '@shared/constants'

export default function DistribusiPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedMustahik, setSelectedMustahik] = useState('')
  const [nominal, setNominal] = useState('')
  const [beratKg, setBeratKg] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [tahunHijriah, setTahunHijriah] = useState(1447)
  const [tahunMasehi, setTahunMasehi] = useState(new Date().getFullYear())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: kuotaData, isLoading, isError } = useQuery({
    queryKey: ['distribusi-kuota', page],
    queryFn: async () => {
      const response = await api.get('/distribusi/kuota', {
        params: { page, limit },
      })
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/distribusi/zakat-keluar', payload)
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
    setShowConfirmDialog(true)
  }

  const confirmSubmit = () => {
    setShowConfirmDialog(false)
    createMutation.mutate({
      mustahik_id: Number(selectedMustahik),
      nominal: nominal ? Number(nominal) : 0,
      berat_kg: beratKg ? Number(beratKg) : 0,
      keterangan: keterangan || null,
      tahun_hijriah: tahunHijriah,
      tahun_masehi: tahunMasehi,
    })
  }

  const getSelectedMustahikName = () => {
    const list = kuotaData?.data || kuotaData?.rekomendasi || []
    const item = list.find((r) => r.id === Number(selectedMustahik))
    return item ? `${item.nama_kepala_keluarga} - ${KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf}` : '-'
  }

  const formatCurrency = (value) => {
    return `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`
  }

  const formatKg = (value) => {
    return `${(Number(value) || 0).toLocaleString('id-ID')} kg`
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Distribusi Zakat</h1>
        <p className="text-xs sm:text-sm text-slate-500">Kelola kuota dan pencatatan distribusi zakat, infaq, dan sedekah.</p>
      </div>

      {isLoading ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center text-slate-500 font-medium text-sm">Memuat data distribusi...</CardContent>
        </Card>
      ) : isError ? (
        <Card className="rounded-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center text-red-600 font-medium text-sm">Gagal memuat data distribusi.</CardContent>
        </Card>
      ) : (
        <>
          {/* Kuota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Kuota Uang per Jiwa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 sm:p-6">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{formatCurrency(kuotaData?.kuota_uang_per_jiwa)}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Total dana masuk: {formatCurrency(kuotaData?.total_uang_masuk)}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                  <Wheat className="h-4 w-4 text-emerald-600" />
                  Kuota Beras per Jiwa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 sm:p-6">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{formatKg(kuotaData?.kuota_beras_per_jiwa)}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Total beras masuk: {formatKg(kuotaData?.total_beras_masuk)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sisa Saldo Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="rounded-xl border border-emerald-200/80 shadow-sm bg-emerald-50/50">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-1.5 sm:gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Sisa Saldo Dana
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 sm:p-6">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-700">
                  {formatCurrency((kuotaData?.total_uang_masuk || 0) - (kuotaData?.total_dana_keluar || 0))}
                </p>
                <p className="text-[10px] sm:text-xs text-emerald-600 mt-1">
                  Masuk: {formatCurrency(kuotaData?.total_uang_masuk)} | Keluar: {formatCurrency(kuotaData?.total_dana_keluar)}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-amber-200/80 shadow-sm bg-amber-50/50">
              <CardHeader className="bg-amber-50/50 border-b border-amber-100 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-semibold text-amber-700 flex items-center gap-1.5 sm:gap-2">
                  <Wheat className="h-4 w-4 text-amber-600" />
                  Sisa Stok Beras
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 sm:p-6">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-700">
                  {formatKg((kuotaData?.total_beras_masuk || 0) - (kuotaData?.total_beras_keluar || 0))}
                </p>
                <p className="text-[10px] sm:text-xs text-amber-600 mt-1">
                  Masuk: {formatKg(kuotaData?.total_beras_masuk)} | Keluar: {formatKg(kuotaData?.total_beras_keluar)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rekomendasi Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Rekomendasi Distribusi per Mustahik</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-xs sm:text-sm">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-slate-700">Nama</th>
                    <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-slate-700">Asnaf</th>
                    <th className="text-right px-3 sm:px-4 py-2.5 font-semibold text-slate-700">Tanggungan</th>
                    <th className="text-right px-3 sm:px-4 py-2.5 font-semibold text-slate-700">Uang</th>
                    <th className="text-right px-3 sm:px-4 py-2.5 font-semibold text-slate-700">Beras</th>
                  </tr>
                </thead>
                <tbody>
                  {kuotaData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 sm:h-32 text-center text-slate-500 px-3 sm:px-4 py-4">
                        Belum ada mustahik terverifikasi.
                      </td>
                    </tr>
                  ) : (
                    kuotaData?.data?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-t border-slate-100">
                        <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-900">
                          <span className="block truncate max-w-[100px] sm:max-w-none">{item.nama_kepala_keluarga}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] sm:text-xs whitespace-nowrap">
                            {KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-slate-600 whitespace-nowrap">{item.jumlah_tanggungan} jiwa</td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-slate-700">{formatCurrency(item.rekomendasi_uang)}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-slate-700">{formatKg(item.rekomendasi_beras)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {kuotaData && kuotaData.pagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/25">
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">
                  {kuotaData.data?.length || 0} dari {kuotaData.pagination.total}
                </span>
                <div className="flex items-center gap-1.5">
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
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-700 px-1.5">
                    {page}/{kuotaData.pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(kuotaData.pagination.totalPages, p + 1))}
                    disabled={page >= kuotaData.pagination.totalPages}
                    className="h-7 sm:h-8 border-slate-200 hover:bg-white text-[10px] sm:text-xs font-medium px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Catat Pengeluaran Distribusi</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-700 text-sm">Mustahik Penerima *</Label>
                  <Select value={selectedMustahik} onValueChange={setSelectedMustahik}>
                    <SelectTrigger className="bg-white border-slate-200 h-10">
                      <SelectValue placeholder="Pilih mustahik..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
                      {(kuotaData?.data || kuotaData?.rekomendasi || []).map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nama_kepala_keluarga} - {KATEGORI_ASNAF_LABELS[item.kategori_asnaf] || item.kategori_asnaf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700 text-sm">Nominal (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      className="bg-white border-slate-200 h-10"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700 text-sm">Beras (kg)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={beratKg}
                      onChange={(e) => setBeratKg(e.target.value)}
                      className="bg-white border-slate-200 h-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-slate-700 text-sm">Keterangan</Label>
                  <Textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="bg-white border-slate-200 min-h-[60px] sm:min-h-[80px] text-sm"
                    placeholder="Opsional..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700 text-sm">Tahun Hijriah</Label>
                    <Input
                      type="number"
                      min={1400}
                      max={1500}
                      value={tahunHijriah}
                      onChange={(e) => setTahunHijriah(Number(e.target.value))}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700 text-sm">Tahun Masehi</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={tahunMasehi}
                      onChange={(e) => setTahunMasehi(Number(e.target.value))}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="bg-white mx-auto max-w-lg rounded-xl border border-slate-200/80 shadow-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Konfirmasi Pengeluaran
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Pastikan data pengeluaran berikut sudah benar sebelum disimpan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 sm:space-y-3 py-4">
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <span className="text-slate-500">Mustahik:</span>
                  <span className="font-medium text-slate-900">{getSelectedMustahikName()}</span>
                  <span className="text-slate-500">Nominal:</span>
                  <span className="font-medium text-emerald-700">{formatCurrency(nominal || 0)}</span>
                  <span className="text-slate-500">Beras:</span>
                  <span className="font-medium text-amber-700">{formatKg(beratKg || 0)}</span>
                  <span className="text-slate-500">Tahun Hijriah:</span>
                  <span className="font-medium text-slate-900">{tahunHijriah}</span>
                  <span className="text-slate-500">Tahun Masehi:</span>
                  <span className="font-medium text-slate-900">{tahunMasehi}</span>
                </div>
                {keterangan && (
                  <div className="pt-2">
                    <span className="text-xs sm:text-sm text-slate-500">Keterangan:</span>
                    <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2 rounded mt-1">{keterangan}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="border-slate-200 w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  onClick={confirmSubmit}
                  disabled={createMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Konfirmasi'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
