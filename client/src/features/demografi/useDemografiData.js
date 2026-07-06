import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export function useDemografiData(filter = {}) {
  return useQuery({
    queryKey: ['demografi', filter],
    queryFn: async () => {
      const response = await api.get('/demografi', { params: filter })
      return response.data
    },
    staleTime: 30_000, // 30 seconds
  })
}

export function useDemografiRTDetail(rtId, filter = {}) {
  return useQuery({
    queryKey: ['demografi', rtId, filter],
    queryFn: async () => {
      const response = await api.get(`/demografi/${rtId}`, { params: filter })
      return response.data
    },
    enabled: !!rtId,
    staleTime: 30_000, // 30 seconds
  })
}

export function formatCurrency(value) {
  return `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`
}

export function formatKg(value) {
  return `${(Number(value) || 0).toLocaleString('id-ID')} kg`
}

export function formatRasio(value) {
  if (value === 'N/A' || value === null || value === undefined) {
    return 'N/A'
  }
  return Number(value).toFixed(2)
}

export const ASNRAF_COLORS = {
  fakir: '#10b981',
  miskin: '#f59e0b',
  amil: '#3b82f6',
  mualaf: '#8b5cf6',
  riqab: '#ec4899',
  gharim: '#ef4444',
  fisabilillah: '#06b6d4',
  ibnu_sabil: '#84cc16',
}
