import { useMemo } from 'react'

export function useTotalCalc(items = []) {
  return useMemo(() => {
    const totalNominal = items.reduce((acc, item) => acc + (Number(item.nominal) || 0), 0)
    const totalBeras = items.reduce((acc, item) => acc + (Number(item.berat_kg) || 0), 0)
    return { totalNominal, totalBeras }
  }, [items])
}
