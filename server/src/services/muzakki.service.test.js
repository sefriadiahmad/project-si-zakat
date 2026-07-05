import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { createMuzakki, updateMuzakki } from './muzakki.service.js'
import { ErrorCodes } from '../utils/errors.js'
import { ZodError } from 'zod'

// Arbitraries for valid and invalid lengths
const validNama = fc.string({ minLength: 1, maxLength: 150 }).filter((s) => s.trim().length > 0)
const overflowNama = fc.string({ minLength: 151, maxLength: 300 })
const validPhone = fc.stringMatching(/^[0-9]{5,20}$/)
const overflowPhone = fc.string({ minLength: 21, maxLength: 50 }).filter((s) => s.trim().length > 0)
const validRtId = fc.integer({ min: 1, max: 100 })
const user = { id: 1 }

describe('muzakki service', () => {

  // Property 4: Input Length Validation Rejects Overflow — overflow nama_lengkap
  test('Property 4a: nama_lengkap > 150 chars is rejected with a validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        overflowNama,
        validPhone,
        validRtId,
        async (nama_lengkap, no_telepon, wilayah_rt_id) => {
          const db = jest.fn()
          await expect(
            createMuzakki({ nama_lengkap, no_telepon, wilayah_rt_id }, user, {
              db,
              auditLog: jest.fn(),
            })
          ).rejects.toThrow(ZodError)
          expect(db).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 30 }
    )
  })

  // Property 4: Input Length Validation Rejects Overflow — overflow no_telepon
  test('Property 4b: no_telepon > 20 chars is rejected with a validation error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNama,
        overflowPhone,
        validRtId,
        async (nama_lengkap, no_telepon, wilayah_rt_id) => {
          const db = jest.fn()
          await expect(
            createMuzakki({ nama_lengkap, no_telepon, wilayah_rt_id }, user, {
              db,
              auditLog: jest.fn(),
            })
          ).rejects.toThrow(ZodError)
          expect(db).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 30 }
    )
  })

  // Property 5: Phone Number Uniqueness Invariant
  test('Property 5: duplicate no_telepon returns PHONE_EXISTS error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNama,
        validPhone,
        validRtId,
        async (nama_lengkap, no_telepon, wilayah_rt_id) => {
          // checkPhone always returns an existing record → triggers uniqueness check
          const checkPhone = async () => ({ id: 99, no_telepon })

          await expect(
            createMuzakki({ nama_lengkap, no_telepon, wilayah_rt_id }, user, {
              checkPhone,
              db: jest.fn(),
              auditLog: jest.fn(),
            })
          ).rejects.toMatchObject({
            statusCode: 400,
            code: ErrorCodes.PHONE_EXISTS,
            message: 'Nomor telepon sudah terdaftar untuk muzakki lain',
          })
        }
      ),
      { numRuns: 30 }
    )
  })

  // Property 5: Phone Number Uniqueness Invariant — update path
  test('Property 5b: duplicate no_telepon on update returns PHONE_EXISTS error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNama,
        validPhone,
        validRtId,
        async (nama_lengkap, no_telepon, wilayah_rt_id) => {
          const checkPhoneExcludingId = async () => ({ id: 99, no_telepon })

          await expect(
            updateMuzakki(1, { nama_lengkap, no_telepon, wilayah_rt_id }, user, {
              checkPhoneExcludingId,
              db: jest.fn(),
              auditLog: jest.fn(),
            })
          ).rejects.toMatchObject({
            statusCode: 400,
            code: ErrorCodes.PHONE_EXISTS,
            message: 'Nomor telepon sudah terdaftar untuk muzakki lain',
          })
        }
      ),
      { numRuns: 30 }
    )
  })
})
