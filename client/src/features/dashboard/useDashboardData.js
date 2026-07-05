import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export function useDashboardData(filter = {}) {
  return useQuery({
    queryKey: ['dashboard', filter],
    queryFn: async () => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
      const fetchPromise = api.get('/dashboard/summary', { params: filter })
      const response = await Promise.race([fetchPromise, timeoutPromise])
      return response.data
    },
    staleTime: 4000,
    refetchInterval: 5000,
  })
}

export function formatCurrency(value) {
  return `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`
}

export function formatKg(value) {
  return `${(Number(value) || 0).toLocaleString('id-ID')} kg`
}

export const CHART_COLORS = {
  fitrah_uang: '#10b981',
  fitrah_beras: '#f59e0b',
  mal: '#3b82f6',
  fidyah: '#8b5cf6',
  infaq: '#ec4899',
}

export const DASIENA_COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]
