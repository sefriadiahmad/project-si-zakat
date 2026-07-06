import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
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
import { Download } from 'lucide-react'
import { JENIS_ZAKAT, JENIS_ZAKAT_LABELS } from '@shared/constants'

export default function LaporanPage() {
  const { toast } = useToast()

  const [tahunHijriah, setTahunHijriah] = useState('')
  const [tahunMasehi, setTahunMasehi] = useState('')
  const [jenisZakat, setJenisZakat] = useState('semua')
  const [wilayahRtId, setWilayahRtId] = useState('')
  const [format, setFormat] = useState('pdf')
  const [isExporting, setIsExporting] = useState(false)

  const { data: rtList = [] } = useQuery({
    queryKey: ['wilayah-rt'],
    queryFn: async () => {
      const response = await api.get('/wilayah-rt')
      return response.data
    },
  })

  const exportMutation = useMutation({
    mutationFn: async (params) => {
      const response = await api.get('/laporan/export', {
        params,
        responseType: 'blob',
      })
      return response
    },
    onSuccess: (response, variables) => {
      const blob = new Blob([response.data], {
        type: variables.format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `laporan-zakat-${Date.now()}.${variables.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Laporan Berhasil Diunduh',
        description: `File laporan format ${variables.format.toUpperCase()} telah diunduh.`,
      })
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Laporan gagal dibuat. Coba lagi atau perkecil rentang periode.'
      toast({
        variant: 'destructive',
        title: 'Gagal Mengekspor Laporan',
        description: message,
      })
    },
    onSettled: () => {
      setIsExporting(false)
    },
  })

  const handleExport = () => {
    const params = {
      format,
      tahun_hijriah: tahunHijriah || undefined,
      tahun_masehi: tahunMasehi || undefined,
      jenis_zakat: jenisZakat || 'semua',
      wilayah_rt_id: wilayahRtId || undefined,
    }

    if (!params.tahun_hijriah && !params.tahun_masehi) {
      toast({
        variant: 'destructive',
        title: 'Filter Wajib Diisi',
        description: 'Pilih minimal satu filter tahun hijriah atau tahun masehi.',
      })
      return
    }

    setIsExporting(true)
    exportMutation.mutate(params)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ekspor Laporan Keuangan</h1>
        <p className="text-sm text-slate-500">Unduh laporan zakat, infaq, dan sedekah dalam format PDF atau XLSX.</p>
      </div>

      <Card className="rounded-xl border border-slate-200/80 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tahunHijriah" className="font-medium text-slate-700">Tahun Hijriah</Label>
              <Input
                id="tahunHijriah"
                type="number"
                min={1400}
                max={1500}
                placeholder="Contoh: 1446"
                value={tahunHijriah}
                onChange={(e) => setTahunHijriah(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahunMasehi" className="font-medium text-slate-700">Tahun Masehi</Label>
              <Input
                id="tahunMasehi"
                type="number"
                min={2000}
                max={2100}
                placeholder="Contoh: 2025"
                value={tahunMasehi}
                onChange={(e) => setTahunMasehi(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenisZakat" className="font-medium text-slate-700">Jenis Zakat</Label>
              <Select value={jenisZakat} onValueChange={setJenisZakat}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Jenis</SelectItem>
                  {JENIS_ZAKAT.map((jenis) => (
                    <SelectItem key={jenis} value={jenis}>
                      {JENIS_ZAKAT_LABELS[jenis]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wilayahRt" className="font-medium text-slate-700">Wilayah RT</Label>
              <Select value={wilayahRtId} onValueChange={setWilayahRtId}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Semua Wilayah RT" />
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
            <div className="space-y-2">
              <Label htmlFor="format" className="font-medium text-slate-700">Format Export</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Pilih format..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-end p-6">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Mengekspor...' : 'Ekspor Laporan'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
