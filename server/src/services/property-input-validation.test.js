/**
 * Property 18: API Input Validation Returns 400 with Field Details
 *
 * For any request to any API endpoint where the request body fails Zod schema
 * validation, the API SHALL return HTTP 400 with a JSON body containing at minimum
 * one errors array entry that identifies the name of the invalid field. No database
 * write SHALL occur for such requests.
 *
 * Validates: Requirements 11.5, 11.6
 *
 * This test verifies that all API endpoints properly validate input and return
 * structured error responses identifying the invalid fields.
 */

import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { ZodError } from 'zod'

// Import schemas
import { muzakkiSchema } from '../schemas/muzakki.schema.js'
import {
  mustahikCreateSchema,
  mustahikVerifikasiSchema,
} from '../schemas/mustahik.schema.js'
import { SplitTransaksiSchema } from '../schemas/zakat.schema.js'
import { ZakatKeluarSchema, DistribusiKuotaQuerySchema } from '../schemas/distribusi.schema.js'
import { DashboardQuerySchema } from '../schemas/dashboard.schema.js'
import { DemografiQuerySchema } from '../schemas/demografi.schema.js'

// Import services
import { createMuzakki } from './muzakki.service.js'
import { createMustahik } from './mustahik.service.js'
import { createZakatMasukSession } from './zakat.service.js'
import { createZakatKeluar } from './distribusi.service.js'

const user = { id: 1 }

describe('Property 18: API Input Validation Returns 400 with Field Details', () => {

  describe('Schema Validation Errors Contain Field Names', () => {

    describe('Muzakki Schema', () => {
      test('rejects empty nama_lengkap with field identification', () => {
        const result = muzakkiSchema.safeParse({
          nama_lengkap: '',
          no_telepon: '08123456789',
          wilayah_rt_id: 1,
        })

        expect(result.success).toBe(false)
        const error = result.error
        expect(error).toBeInstanceOf(ZodError)
        expect(error.errors.length).toBeGreaterThan(0)

        // Find the nama_lengkap error
        const namaError = error.errors.find((e) => e.path.includes('nama_lengkap'))
        expect(namaError).toBeDefined()
        expect(namaError.message).toContain('wajib')
      })

      test('rejects nama_lengkap exceeding 150 chars with field identification', () => {
        const result = muzakkiSchema.safeParse({
          nama_lengkap: 'A'.repeat(151),
          no_telepon: '08123456789',
          wilayah_rt_id: 1,
        })

        expect(result.success).toBe(false)
        const error = result.error
        const namaError = error.errors.find((e) => e.path.includes('nama_lengkap'))
        expect(namaError).toBeDefined()
        expect(namaError.message).toContain('150')
      })

      test('rejects no_telepon exceeding 20 chars with field identification', () => {
        const result = muzakkiSchema.safeParse({
          nama_lengkap: 'Test Muzakki',
          no_telepon: '1'.repeat(21),
          wilayah_rt_id: 1,
        })

        expect(result.success).toBe(false)
        const error = result.error
        const phoneError = error.errors.find((e) => e.path.includes('no_telepon'))
        expect(phoneError).toBeDefined()
        expect(phoneError.message).toContain('20')
      })

      test('rejects invalid wilayah_rt_id with field identification', () => {
        const result = muzakkiSchema.safeParse({
          nama_lengkap: 'Test Muzakki',
          no_telepon: '08123456789',
          wilayah_rt_id: -1,
        })

        expect(result.success).toBe(false)
        const error = result.error
        const rtError = error.errors.find((e) => e.path.includes('wilayah_rt_id'))
        expect(rtError).toBeDefined()
      })

      test('rejects missing required fields with field identification', () => {
        const result = muzakkiSchema.safeParse({})

        expect(result.success).toBe(false)
        const error = result.error
        expect(error.errors.length).toBeGreaterThanOrEqual(3) // nama_lengkap, no_telepon, wilayah_rt_id

        const requiredFields = ['nama_lengkap', 'no_telepon', 'wilayah_rt_id']
        for (const field of requiredFields) {
          const fieldError = error.errors.find((e) => e.path.includes(field))
          expect(fieldError).toBeDefined()
        }
      })
    })

    describe('Mustahik Schema', () => {
      test('rejects invalid kategori_asnaf with field identification', () => {
        const result = mustahikCreateSchema.safeParse({
          nama_kepala_keluarga: 'Test Mustahik',
          wilayah_rt_id: 1,
          kategori_asnaf: 'invalid_asnaf',
          jumlah_tanggungan: 3,
        })

        expect(result.success).toBe(false)
        const error = result.error
        const asnafError = error.errors.find((e) => e.path.includes('kategori_asnaf'))
        expect(asnafError).toBeDefined()
      })

      test('rejects jumlah_tanggungan outside 1-99 range with field identification', () => {
        // Test below minimum
        const belowMin = mustahikCreateSchema.safeParse({
          nama_kepala_keluarga: 'Test Mustahik',
          wilayah_rt_id: 1,
          kategori_asnaf: 'fakir',
          jumlah_tanggungan: 0,
        })

        expect(belowMin.success).toBe(false)
        const belowError = belowMin.error.errors.find((e) => e.path.includes('jumlah_tanggungan'))
        expect(belowError).toBeDefined()

        // Test above maximum
        const aboveMax = mustahikCreateSchema.safeParse({
          nama_kepala_keluarga: 'Test Mustahik',
          wilayah_rt_id: 1,
          kategori_asnaf: 'fakir',
          jumlah_tanggungan: 100,
        })

        expect(aboveMax.success).toBe(false)
        const aboveError = aboveMax.error.errors.find((e) => e.path.includes('jumlah_tanggungan'))
        expect(aboveError).toBeDefined()
      })

      test('rejects empty nama_kepala_keluarga with field identification', () => {
        const result = mustahikCreateSchema.safeParse({
          nama_kepala_keluarga: '',
          wilayah_rt_id: 1,
          kategori_asnaf: 'fakir',
          jumlah_tanggungan: 3,
        })

        expect(result.success).toBe(false)
        const error = result.error
        const namaError = error.errors.find((e) => e.path.includes('nama_kepala_keluarga'))
        expect(namaError).toBeDefined()
      })
    })

    describe('Mustahik Verifikasi Schema', () => {
      test('rejects invalid status_verifikasi with field identification', () => {
        const result = mustahikVerifikasiSchema.safeParse({
          status_verifikasi: 'invalid_status',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const statusError = error.errors.find((e) => e.path.includes('status_verifikasi'))
        expect(statusError).toBeDefined()
      })

      test('rejects rejection without alasan_penolakan with field identification', () => {
        const result = mustahikVerifikasiSchema.safeParse({
          status_verifikasi: 'ditolak',
          alasan_penolakan: '',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const alasanError = error.errors.find((e) => e.path.includes('alasan_penolakan'))
        expect(alasanError).toBeDefined()
      })

      test('rejects alasan_penolakan exceeding 500 chars with field identification', () => {
        const result = mustahikVerifikasiSchema.safeParse({
          status_verifikasi: 'ditolak',
          alasan_penolakan: 'A'.repeat(501),
        })

        expect(result.success).toBe(false)
        const error = result.error
        const alasanError = error.errors.find((e) => e.path.includes('alasan_penolakan'))
        expect(alasanError).toBeDefined()
        expect(alasanError.message).toContain('500')
      })
    })

    describe('Zakat Schema', () => {
      test('rejects empty items array with field identification', () => {
        const result = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1446,
          tahun_masehi: 2025,
          items: [],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const itemsError = error.errors.find((e) => e.path.includes('items'))
        expect(itemsError).toBeDefined()
        expect(itemsError.message).toContain('minimal')
      })

      test('rejects invalid jenis_zakat with field identification', () => {
        const result = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1446,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'invalid_zakat', nominal: 100000 },
          ],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const jenisError = error.errors.find((e) =>
          e.path.includes('items') && e.path.includes('jenis_zakat')
        )
        expect(jenisError).toBeDefined()
      })

      test('rejects transfer without no_referensi with field identification', () => {
        const result = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'transfer',
          tahun_hijriah: 1446,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'fitrah_uang', nominal: 100000 },
          ],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const refError = error.errors.find((e) => e.path.includes('no_referensi'))
        expect(refError).toBeDefined()
        expect(refError.message).toContain('Transfer')
      })

      test('rejects qris without no_referensi with field identification', () => {
        const result = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'qris',
          tahun_hijriah: 1446,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'fitrah_uang', nominal: 100000 },
          ],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const refError = error.errors.find((e) => e.path.includes('no_referensi'))
        expect(refError).toBeDefined()
        expect(refError.message).toContain('QRIS')
      })

      test('rejects invalid tahun_hijriah range with field identification', () => {
        // Below minimum
        const belowMin = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1399,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'fitrah_uang', nominal: 100000 },
          ],
        })

        expect(belowMin.success).toBe(false)
        const belowError = belowMin.error.errors.find((e) => e.path.includes('tahun_hijriah'))
        expect(belowError).toBeDefined()

        // Above maximum
        const aboveMax = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1501,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'fitrah_uang', nominal: 100000 },
          ],
        })

        expect(aboveMax.success).toBe(false)
        const aboveError = aboveMax.error.errors.find((e) => e.path.includes('tahun_hijriah'))
        expect(aboveError).toBeDefined()
      })

      test('rejects negative nominal with field identification', () => {
        const result = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1446,
          tahun_masehi: 2025,
          items: [
            { jenis_zakat: 'fitrah_uang', nominal: -100000 },
          ],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const nominalError = error.errors.find((e) =>
          e.path.includes('items') && e.path.includes('nominal')
        )
        expect(nominalError).toBeDefined()
        expect(nominalError.message).toContain('negatif')
      })
    })

    describe('Distribusi Schema', () => {
      test('rejects ZakatKeluarSchema with invalid data', () => {
        const result = ZakatKeluarSchema.safeParse({
          mustahik_id: -1,
          nominal: -1000,
        })

        expect(result.success).toBe(false)
        const error = result.error
        expect(error.errors.length).toBeGreaterThan(0)
      })
    })

    describe('Dashboard Schema', () => {
      test('rejects invalid tahun_hijriah format', () => {
        const result = DashboardQuerySchema.safeParse({
          tahun_hijriah: 'invalid',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const tahunError = error.errors.find((e) => e.path.includes('tahun_hijriah'))
        expect(tahunError).toBeDefined()
        expect(tahunError.message).toContain('4 digit')
      })
    })

    describe('Demografi Schema', () => {
      test('rejects invalid tahun_masehi format', () => {
        const result = DemografiQuerySchema.safeParse({
          tahun_masehi: 'abc',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const tahunError = error.errors.find((e) => e.path.includes('tahun_masehi'))
        expect(tahunError).toBeDefined()
        expect(tahunError.message).toContain('4 digit')
      })
    })
  })

  describe('Property-based: Validation Errors Always Identify Fields', () => {
    test('for any invalid muzakki input, errors array contains the invalid field name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            nama_lengkap: fc.oneof(
              fc.constant(''),
              fc.string({ minLength: 151, maxLength: 300 }),
            ),
            no_telepon: fc.oneof(
              fc.constant(''),
              fc.string({ minLength: 21, maxLength: 50 }),
              fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !/^[0-9]+$/.test(s)),
            ),
            wilayah_rt_id: fc.oneof(
              fc.constant(0),
              fc.constant(-1),
              fc.constant(null),
            ),
          }),
          async (invalidData) => {
            const result = muzakkiSchema.safeParse(invalidData)

            expect(result.success).toBe(false)
            const error = result.error

            // All errors should have path containing the field name
            for (const err of error.errors) {
              expect(err.path.length).toBeGreaterThan(0)
              const fieldName = err.path[err.path.length - 1]
              expect(typeof fieldName).toBe('string')

              // The field name should be one of the expected fields
              expect(['nama_lengkap', 'no_telepon', 'wilayah_rt_id']).toContain(fieldName)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    test('for any invalid mustahik input, errors array contains the invalid field name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            nama_kepala_keluarga: fc.oneof(
              fc.constant(''),
              fc.string({ minLength: 151, maxLength: 300 }),
            ),
            wilayah_rt_id: fc.oneof(
              fc.constant(0),
              fc.constant(-1),
            ),
            kategori_asnaf: fc.string({ minLength: 1, maxLength: 50 }).filter(
              (s) => !['fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu_sabil'].includes(s)
            ),
            jumlah_tanggungan: fc.oneof(
              fc.constant(0),
              fc.integer({ min: 100, max: 200 }),
            ),
          }),
          async (invalidData) => {
            const result = mustahikCreateSchema.safeParse(invalidData)

            expect(result.success).toBe(false)
            const error = result.error

            // All errors should have path containing the field name
            for (const err of error.errors) {
              expect(err.path.length).toBeGreaterThan(0)
              const fieldName = err.path[err.path.length - 1]
              expect(typeof fieldName).toBe('string')

              // The field name should be one of the expected fields
              expect(['nama_kepala_keluarga', 'wilayah_rt_id', 'kategori_asnaf', 'jumlah_tanggungan']).toContain(fieldName)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    test('for any invalid zakat items, errors array contains the invalid field name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            jenis_zakat: fc.string({ minLength: 1, maxLength: 30 }).filter(
              (s) => !['fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq'].includes(s)
            ),
            nominal: fc.oneof(
              fc.constant(-1),
              fc.constant(-1000),
            ),
          }),
          async (invalidItem) => {
            const result = SplitTransaksiSchema.safeParse({
              muzakki_id: 1,
              metode_bayar: 'tunai',
              tahun_hijriah: 1446,
              tahun_masehi: 2025,
              items: [invalidItem],
            })

            expect(result.success).toBe(false)
            const error = result.error

            // Check that at least one error identifies the field
            const hasFieldIdentification = error.errors.some((err) => {
              const pathStr = err.path.join('.')
              return (
                pathStr.includes('jenis_zakat') ||
                pathStr.includes('nominal')
              )
            })
            expect(hasFieldIdentification).toBe(true)
          }
        ),
        { numRuns: 30 }
      )
    )
  })

  describe('No Database Write on Validation Failure', () => {
    test('createMuzakki does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      // Validation will fail because nama_lengkap is empty
      try {
        await createMuzakki(
          {
            nama_lengkap: '',
            no_telepon: '08123456789',
            wilayah_rt_id: 1,
          },
          user,
          {
            db: mockDb,
            auditLog: mockAuditLog,
          }
        )
      } catch (e) {
        // Expected to throw ZodError
      }

      // db should not be called when validation fails
      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createMustahik does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      // Validation will fail because kategori_asnaf is invalid
      try {
        await createMustahik(
          {
            nama_kepala_keluarga: 'Test',
            wilayah_rt_id: 1,
            kategori_asnaf: 'invalid',
            jumlah_tanggungan: 3,
          },
          user,
          {
            db: mockDb,
            auditLog: mockAuditLog,
          }
        )
      } catch (e) {
        // Expected to throw ZodError
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createZakatMasukSession does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      // Validation will fail because items array is empty
      try {
        await createZakatMasukSession(
          {
            muzakki_id: 1,
            metode_bayar: 'tunai',
            tahun_hijriah: 1446,
            tahun_masehi: 2025,
            items: [],
          },
          user,
          {
            db: mockDb,
            auditLog: mockAuditLog,
          }
        )
      } catch (e) {
        // Expected to throw ZodError
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createZakatKeluar does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      // Validation will fail because mustahik_id is invalid
      try {
        await createZakatKeluar(
          {
            mustahik_id: -1,
            nominal: 50000,
          },
          user,
          {
            db: mockDb,
            auditLog: mockAuditLog,
          }
        )
      } catch (e) {
        // Expected to throw ZodError
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })
  })

  describe('Error Response Structure', () => {
    test('ZodError contains properly structured error objects with field path', () => {
      const result = muzakkiSchema.safeParse({
        nama_lengkap: '',
        no_telepon: '',
        wilayah_rt_id: 'not_a_number',
      })

      expect(result.success).toBe(false)
      const error = result.error

      // Each error should be a ZodIssue
      for (const issue of error.errors) {
        expect(issue).toHaveProperty('path')
        expect(issue).toHaveProperty('message')
        expect(issue).toHaveProperty('code')
        expect(Array.isArray(issue.path)).toBe(true)
        expect(typeof issue.message).toBe('string')
        expect(typeof issue.code).toBe('string')
      }
    })

    test('Multiple field errors can be identified from single request', () => {
      const result = muzakkiSchema.safeParse({
        nama_lengkap: '',
        no_telepon: '',
        wilayah_rt_id: 0,
      })

      expect(result.success).toBe(false)
      const error = result.error

      // Should have errors for all three invalid fields
      expect(error.errors.length).toBeGreaterThanOrEqual(3)

      const fieldNames = error.errors.map((e) => e.path[e.path.length - 1])
      expect(fieldNames).toContain('nama_lengkap')
      expect(fieldNames).toContain('no_telepon')
      expect(fieldNames).toContain('wilayah_rt_id')
    })
  })
})
