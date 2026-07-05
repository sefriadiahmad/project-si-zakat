import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { getDashboardSummary } from '../services/dashboard.service.js'
import { getLaporanExportData } from '../services/laporan.service.js'
import { buildZakatMockDb } from './__mocks__/buildMockDb.js'

describe('Property 13: Dashboard and Laporan Aggregate Consistency', () => {
  test('for any dataset and period filter, dashboard summary totals match laporan export totals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            jenis_zakat: fc.constantFrom('fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq'),
            nominal: fc.double({ min: 0, max: 10_000_000 }).map((v) => Math.round(v * 100) / 100),
            berat_kg: fc.double({ min: 0, max: 1000 }).map((v) => Math.round(v * 1000) / 1000),
            tahun_hijriah: fc.integer({ min: 1400, max: 1500 }),
            tahun_masehi: fc.integer({ min: 2000, max: 2100 }),
          }),
          { maxLength: 20 }
        ),
        fc.option(fc.integer({ min: 1400, max: 1500 }), { nilable: true }),
        fc.option(fc.integer({ min: 2000, max: 2100 }), { nilable: true }),
        async (zakatRows, optHijriah, optMasehi) => {
          const db = buildZakatMockDb(zakatRows)

          const [dashboard, laporan] = await Promise.all([
            getDashboardSummary({ tahun_hijriah: optHijriah, tahun_masehi: optMasehi }, { db }),
            getLaporanExportData({ tahun_hijriah: optHijriah, tahun_masehi: optMasehi, format: 'pdf', jenis_zakat: 'semua' }, { db }),
          ])

          const expectedNominal = Number(
            (laporan.data || []).reduce((acc, item) => {
              if (['fitrah_uang', 'mal', 'fidyah', 'infaq'].includes(item.jenis_zakat)) {
                return acc + (Number(item.nominal) || 0)
              }
              return acc
            }, 0).toFixed(2)
          )

          const expectedBeras = Number(
            (laporan.data || []).reduce((acc, item) => {
              if (item.jenis_zakat === 'fitrah_beras') {
                return acc + (Number(item.berat_kg) || 0)
              }
              return acc
            }, 0).toFixed(3)
          )

          expect(dashboard.total_nominal).toBeCloseTo(expectedNominal, 2)
          expect(dashboard.total_beras).toBeCloseTo(expectedBeras, 3)
        }
      ),
      { numRuns: 30 }
    )
  })
})
