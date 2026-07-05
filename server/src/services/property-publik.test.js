import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { getPublikSummary } from '../services/publik.service.js'
import { buildZakatMockDb } from './__mocks__/buildMockDb.js'

const PII_FIELDS = [
  'nama_lengkap',
  'nama_kepala_keluarga',
  'no_telepon',
  'alamat_detail',
  'catatan',
  'password_hash',
]

describe('Property 14: Public API Returns No PII', () => {
  test('for any dataset, publik summary response contains no PII fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            jenis_zakat: fc.constantFrom('fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq'),
            nominal: fc.double({ min: 0, max: 10_000_000 }).map((v) => Math.round(v * 100) / 100),
            berat_kg: fc.double({ min: 0, max: 1000 }).map((v) => Math.round(v * 1000) / 1000),
            tahun_hijriah: fc.integer({ min: 1400, max: 1500 }),
            tahun_masehi: fc.integer({ min: 2000, max: 2100 }),
            nama_lengkap: fc.string(),
            no_telepon: fc.string(),
            alamat_detail: fc.string(),
          }),
          { maxLength: 20 }
        ),
        async (rows) => {
          const db = buildZakatMockDb(rows)
          const result = await getPublikSummary({}, { db })

          const keys = Object.keys(result)
          for (const key of keys) {
            expect(PII_FIELDS).not.toContain(key)
          }

          if (Array.isArray(result.chart_muzakki_rt)) {
            for (const row of result.chart_muzakki_rt) {
              const rowKeys = Object.keys(row)
              for (const key of rowKeys) {
                expect(PII_FIELDS).not.toContain(key)
              }
            }
          }

          if (Array.isArray(result.chart_asnaf_donat)) {
            for (const row of result.chart_asnaf_donat) {
              const rowKeys = Object.keys(row)
              for (const key of rowKeys) {
                expect(PII_FIELDS).not.toContain(key)
              }
            }
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})
