import test from 'node:test'
import fc from 'fast-check'
import { hitungZakat } from './zakatCalculator.js'
import assert from 'node:assert/strict'

test('Property 15: Zakat Calculator Mathematical Correctness', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }).map((v) => v), // jumlah jiwa already int
      fc.double({ min: 0, max: 1_000_000, noDefaultInfinity: true }).filter((v) => Number.isFinite(v)).map((v) => Math.round(v * 100) / 100),
      fc.double({ min: 0, max: 100_000_000_000, noDefaultInfinity: true }).filter((v) => Number.isFinite(v)).map((v) => Math.round(v * 100) / 100),
      fc.double({ min: 0, max: 100_000_000_000, noDefaultInfinity: true }).filter((v) => Number.isFinite(v)).map((v) => Math.round(v * 100) / 100),
      (J, H, A, N) => {
        const result = hitungZakat({
          jumlah_jiwa: J,
          harga_beras_per_kg: H,
          nilai_harta: A,
          nilai_nisab: N,
        })

        const expectedFitrahUang = Number((J * H * 2.5).toFixed(2))
        const expectedFitrahBeras = Number((J * 2.5).toFixed(3))
        const expectedMal = Number((Math.max(0, A - N) * 0.025).toFixed(2))

        assert.strictEqual(result.zakat_fitrah_uang, expectedFitrahUang)
        assert.strictEqual(result.zakat_fitrah_beras, expectedFitrahBeras)
        assert.strictEqual(result.zakat_mal, expectedMal)
      }
    ),
    { numRuns: 100 }
  )
})

test('for any invalid input, calculator returns all zeros', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.double({ noDefaultInfinity: true }).filter((v) => v < 0 || !Number.isFinite(v)),
      ),
      (invalidValue) => {
        const result = hitungZakat({
          jumlah_jiwa: invalidValue,
          harga_beras_per_kg: 12000,
          nilai_harta: 10000000,
          nilai_nisab: 5000000,
        })
        assert.strictEqual(result.zakat_fitrah_uang, 0)
        assert.strictEqual(result.zakat_fitrah_beras, 0)
        assert.strictEqual(result.zakat_mal, 0)
      }
    ),
    { numRuns: 50 }
  )
})
