import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Checkbox,
} from '@shared/components'
import { useToast } from '@shared/components/toaster'
import { ArrowLeft, ArrowRight, Save, Search } from 'lucide-react'
import { useTotalCalc } from './useTotalCalc'
import { JENIS_ZAKAT, JENIS_ZAKAT_LABELS, METODE_BAYAR, METODE_BAYAR_LABELS } from '@shared/constants'

const STEP_LABELS = ['Pilih Muzakki', 'Pilih & Isi Item', 'Metode Bayar', 'Review & Konfirmasi']

// Helper: Calculate approximate Hijri year from Gregorian year
// Formula: Hijri ≈ Gregorian - 622 + (Gregorian - 622) / 33
function getApproximateHijriYear(gregorianYear = new Date().getFullYear()) {
  return Math.round(gregorianYear - 622 + (gregorianYear - 622) / 33)
}

const emptyItem = () => ({
  jenis_zakat: 'fitrah_uang',
  nominal: 0,
  berat_kg: 0,
  jumlah_jiwa: 1,
  kembalian_infaq: 0,
})

export default function FunnelFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [selectedMuzakki, setSelectedMuzakki] = useState(null)
  const [muzakkiSearch, setMuzakkiSearch] = useState('')
  const [items, setItems] = useState([])
  const [metodeBayar, setMetodeBayar] = useState('tunai')
  const [noReferensi, setNoReferensi] = useState('')
  const [tahunHijriah, setTahunHijriah] = useState(getApproximateHijriYear())
  const [tahunMasehi, setTahunMasehi] = useState(new Date().getFullYear())

  const { totalNominal, totalBeras } = useTotalCalc(items)

  const { data: muzakkiResults = [] } = useQuery({
    queryKey: ['muzakki-search', muzakkiSearch],
    queryFn: async () => {
      if (!muzakkiSearch.trim()) return []
      const response = await api.get('/muzakki', {
        params: { search: muzakkiSearch, limit: 10 },
      })
      return response.data.data || []
    },
    enabled: muzakkiSearch.trim().length > 0,
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/zakat/masuk', payload)
      return response.data
    },
    onSuccess: (data) => {
      // Refresh dashboard totals and any related zakat-session data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['zakat-session'] })
      toast({
        title: 'Transaksi Berhasil',
        description: `Transaksi ${data.session_id} berhasil disimpan.`,
      })
      navigate(`/transaksi/${data.session_id}`)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Transaksi',
        description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
      })
    },
  })

  const handleSelectMuzakki = (muzakki) => {
    setSelectedMuzakki(muzakki)
    setStep(2)
  }

  const toggleItem = (jenis) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.jenis_zakat === jenis)
      if (exists) {
        return prev.filter((i) => i.jenis_zakat !== jenis)
      }
      return [...prev, { ...emptyItem(), jenis_zakat: jenis }]
    })
  }

  const updateItem = (jenis, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.jenis_zakat === jenis ? { ...item, [field]: value } : item))
    )
  }

  const canProceedStep1 = Boolean(selectedMuzakki)
  const canProceedStep2 = items.length > 0
  const canProceedStep3 = ['tunai', 'transfer', 'qris'].includes(metodeBayar) && (!['transfer', 'qris'].includes(metodeBayar) || noReferensi.trim().length >= 5)

  const handleNext = () => {
    if (step === 1 && canProceedStep1) setStep(2)
    else if (step === 2 && canProceedStep2) setStep(3)
    else if (step === 3 && canProceedStep3) setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const handleSubmit = () => {
    if (!selectedMuzakki) return
    const payload = {
      muzakki_id: selectedMuzakki.id,
      metode_bayar: metodeBayar,
      no_referensi: noReferensi || undefined,
      tahun_hijriah: tahunHijriah,
      tahun_masehi: tahunMasehi,
      items: items.map((item) => ({
        jenis_zakat: item.jenis_zakat,
        nominal: item.nominal || 0,
        berat_kg: item.berat_kg || 0,
        jumlah_jiwa: item.jumlah_jiwa || undefined,
        kembalian_infaq: item.kembalian_infaq || 0,
      })),
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Transaksi Zakat Baru</h1>
          <p className="text-xs sm:text-sm text-slate-500">Pencatatan pembayaran zakat, infaq, dan sedekah.</p>
        </div>
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} className="gap-1.5 sm:gap-2 border-slate-200 text-xs sm:text-sm w-full sm:w-auto">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Kembali
          </Button>
        )}
      </div>

      {/* Step Indicators - Horizontal Scroll */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center justify-start sm:justify-between min-w-max sm:min-w-0">
          {STEP_LABELS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div
                  className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                    step > idx + 1
                      ? 'bg-emerald-600 text-white'
                      : step === idx + 1
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] sm:text-sm font-medium ${step === idx + 1 ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
              </div>
              {idx < STEP_LABELS.length - 1 && <div className="w-6 sm:w-8 h-px bg-slate-200 mx-1 sm:mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200/80 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-3 sm:p-4">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900">{STEP_LABELS[step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="font-medium text-slate-700 text-sm">Cari Muzakki</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Ketik nama atau nomor telepon..."
                    value={muzakkiSearch}
                    onChange={(e) => setMuzakkiSearch(e.target.value)}
                    className="pl-9 bg-slate-50/50 border-slate-200 h-10"
                  />
                </div>
              </div>
              {muzakkiResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {muzakkiResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50 flex items-center justify-between"
                      onClick={() => handleSelectMuzakki(m)}
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{m.nama_lengkap}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">{m.no_telepon} · {m.nama_rt || `RT ${m.wilayah_rt_id}`}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMuzakki && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">{selectedMuzakki.nama_lengkap}</p>
                    <p className="text-xs text-emerald-700">{selectedMuzakki.no_telepon} · {selectedMuzakki.nama_rt || `RT ${selectedMuzakki.wilayah_rt_id}`}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMuzakki(null)} className="text-emerald-700 text-xs sm:text-sm">
                    Ganti
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {JENIS_ZAKAT.map((jenis) => {
                  const isActive = items.some((i) => i.jenis_zakat === jenis)
                  const item = items.find((i) => i.jenis_zakat === jenis)
                  const showNominal = ['fitrah_uang', 'mal', 'fidyah', 'infaq'].includes(jenis)
                  const showBeras = jenis === 'fitrah_beras'
                  const showJiwa = ['fitrah_uang', 'fitrah_beras', 'fidyah'].includes(jenis)

                  return (
                    <div
                      key={jenis}
                      className={`rounded-lg border p-3 sm:p-4 transition-colors ${isActive ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={() => toggleItem(jenis)}
                          />
                          <Label className="font-semibold text-slate-900 text-sm">{JENIS_ZAKAT_LABELS[jenis]}</Label>
                        </div>
                      </div>
                      {isActive && (
                        <div className="space-y-2 sm:space-y-3 pl-6 sm:pl-7">
                          {showNominal && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Nominal (Rp)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item?.nominal || 0}
                                onChange={(e) => updateItem(jenis, 'nominal', Number(e.target.value))}
                                className="bg-white border-slate-200 h-9 sm:h-10"
                              />
                            </div>
                          )}
                          {showBeras && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Berat (kg)</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item?.berat_kg || 0}
                                onChange={(e) => updateItem(jenis, 'berat_kg', Number(e.target.value))}
                                className="bg-white border-slate-200 h-9 sm:h-10"
                              />
                            </div>
                          )}
                          {showJiwa && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Jumlah Jiwa</Label>
                              <Input
                                type="number"
                                min={1}
                                max={99}
                                value={item?.jumlah_jiwa || 1}
                                onChange={(e) => updateItem(jenis, 'jumlah_jiwa', Math.min(99, Math.max(1, Number(e.target.value))))}
                                className="bg-white border-slate-200 h-9 sm:h-10"
                              />
                            </div>
                          )}
                          {jenis === 'infaq' && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Kembalian Infaq (Rp)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item?.kembalian_infaq || 0}
                                onChange={(e) => updateItem(jenis, 'kembalian_infaq', Number(e.target.value))}
                                className="bg-white border-slate-200 h-9 sm:h-10"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {items.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">Total Real-time</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Berdasarkan nilai yang Anda isi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-bold text-slate-900">Rp {totalNominal.toLocaleString('id-ID')}</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">{totalBeras.toLocaleString('id-ID')} kg</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 sm:space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label className="font-medium text-slate-700 text-sm">Metode Pembayaran</Label>
                <Select value={metodeBayar} onValueChange={setMetodeBayar}>
                  <SelectTrigger className="bg-white border-slate-200 h-10">
                    <SelectValue placeholder="Pilih metode bayar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white border border-slate-200 shadow-md">
                    {METODE_BAYAR.map((m) => (
                      <SelectItem key={m} value={m}>{METODE_BAYAR_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['transfer', 'qris'].includes(metodeBayar) && (
                <div className="space-y-2">
                  <Label className="font-medium text-slate-700 text-sm">Nomor Referensi</Label>
                  <Input
                    placeholder="Minimal 5 karakter"
                    value={noReferensi}
                    onChange={(e) => setNoReferensi(e.target.value)}
                    className="bg-white border-slate-200 h-10"
                  />
                  {noReferensi.length > 0 && noReferensi.length < 5 && (
                    <p className="text-xs text-red-600">Nomor referensi minimal 5 karakter.</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">Tahun Hijriah</Label>
                  <Input
                    type="number"
                    min={1400}
                    max={1500}
                    value={tahunHijriah}
                    onChange={(e) => setTahunHijriah(Number(e.target.value))}
                    className="bg-white border-slate-200 h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">Tahun Masehi</Label>
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-slate-700">Muzakki: <span className="font-semibold text-slate-900">{selectedMuzakki?.nama_lengkap}</span></p>
                <p className="text-xs sm:text-sm text-slate-600">Metode Bayar: {METODE_BAYAR_LABELS[metodeBayar]}</p>
                {['transfer', 'qris'].includes(metodeBayar) && (
                  <p className="text-xs sm:text-sm text-slate-600">Referensi: {noReferensi}</p>
                )}
                <p className="text-xs sm:text-sm text-slate-600">Periode: {tahunHijriah} H / {tahunMasehi} M</p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[350px] text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 sm:px-4 py-2 font-semibold text-slate-700">Jenis</th>
                        <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Nominal</th>
                        <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Beras</th>
                        <th className="text-right px-3 sm:px-4 py-2 font-semibold text-slate-700">Jiwa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.jenis_zakat} className="hover:bg-slate-50/50">
                          <td className="px-3 sm:px-4 py-2 font-medium text-slate-900">{JENIS_ZAKAT_LABELS[item.jenis_zakat]}</td>
                          <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                            {['fitrah_uang', 'mal', 'fidyah', 'infaq'].includes(item.jenis_zakat)
                              ? `Rp ${(item.nominal || 0).toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                            {item.jenis_zakat === 'fitrah_beras' ? `${(item.berat_kg || 0).toLocaleString('id-ID')} kg` : '-'}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-right text-slate-700">
                            {['fitrah_uang', 'fitrah_beras', 'fidyah'].includes(item.jenis_zakat)
                              ? item.jumlah_jiwa || '-'
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-emerald-900">Total Transaksi</p>
                  <p className="text-[10px] sm:text-xs text-emerald-700">Termasuk semua item yang dipilih</p>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold text-emerald-900">Rp {totalNominal.toLocaleString('id-ID')}</p>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-700">{totalBeras.toLocaleString('id-ID')} kg</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2 p-4 sm:p-6">
          {step < 4 ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleBack} disabled={step === 1} className="border-slate-200 text-xs sm:text-sm flex-1 sm:flex-none">
                Sebelumnya
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm gap-1.5 sm:gap-2 flex-1 sm:flex-none"
              >
                Lanjutkan
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleBack} className="border-slate-200 text-xs sm:text-sm flex-1 sm:flex-none">
                Sebelumnya
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm gap-1.5 sm:gap-2 flex-1 sm:flex-none"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
