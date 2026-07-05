import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { ZodError } from 'zod'
import { createMustahik } from './mustahik.service.js'
import { KATEGORI_ASNAF } from '../constants/domain.js'

const validNama = fc.string({ minLength: 1, maxLength: 150 }).filter((s) => s.trim().length > 0)
const validRtId = fc.integer({ min: 1, max: 100 })
const validTanggungan = fc.integer({ min: 1, max: 99 })
const invalidAsnaf = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => !KATEGORI_ASNAF.includes(s)
)
const user = { id: 1 }

describe('mustahik service', () => {
  // Property 6: Asnaf Category Constraint
  test('Property 6: invalid kategori_asnaf is rejected with a validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNama,
        validRtId,
        invalidAsnaf,
        validTanggungan,
        async (nama_kepala_keluarga, wilayah_rt_id, kategori_asnaf, jumlah_tanggungan) => {
          const db = jest.fn()
          await expect(
            createMustahik(
              { nama_kepala_keluarga, wilayah_rt_id, kategori_asnaf, jumlah_tanggungan },
              user,
              { db, auditLog: jest.fn() }
            )
          ).rejects.toThrow(ZodError)
          expect(db).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 50 }
    )
  })
})
