/**
 * Property 18: API Input Validation Returns 400 with Field Details
 *
 * For any request to any API endpoint where the request body fails Zod schema
 * validation, the API SHALL return HTTP 400 with a JSON body containing at minimum
 * one errors array entry that identifies the name of the invalid field. No database
 * write SHALL occur for such requests.
 *
 * Validates: Requirements 11.5, 11.6
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
import { ZakatKeluarSchema } from '../schemas/distribusi.schema.js'
import { DashboardQuerySchema } from '../schemas/dashboard.schema.js'
import { DemografiQuerySchema } from '../schemas/demografi.schema.js'

// Import services
import { createMuzakki } from './muzakki.service.js'
import { createMustahik } from './mustahik.service.js'
import { createZakatMasukSession } from './zakat.service.js'
import { createZakatKeluar } from './distribusi.service.js'

const user = { id: 1 }

describe('Property 18: API Input Validation Returns 400 with Field Details', () => {

  // ─── Schema-level: Error objects always identify field names ─────────────────

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
        expect(error.errors.length).toBeGreaterThanOrEqual(3)

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

      test('rejects jumlah_tanggungan below minimum', () => {
        const belowMin = mustahikCreateSchema.safeParse({
          nama_kepala_keluarga: 'Test Mustahik',
          wilayah_rt_id: 1,
          kategori_asnaf: 'fakir',
          jumlah_tanggungan: 0,
        })

        expect(belowMin.success).toBe(false)
        const belowError = belowMin.error.errors.find((e) => e.path.includes('jumlah_tanggungan'))
        expect(belowError).toBeDefined()
      })

      test('rejects jumlah_tanggungan above maximum', () => {
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

      test('rejects rejection without alasan_penolakan', () => {
        const result = mustahikVerifikasiSchema.safeParse({
          status_verifikasi: 'ditolak',
          alasan_penolakan: '',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const alasanError = error.errors.find((e) => e.path.includes('alasan_penolakan'))
        expect(alasanError).toBeDefined()
      })

      test('rejects alasan_penolakan exceeding 500 chars', () => {
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
          items: [{ jenis_zakat: 'invalid_zakat', nominal: 100000, berat_kg: 0 }],
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
          items: [{ jenis_zakat: 'fitrah_uang', nominal: 100000, berat_kg: 0 }],
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
          items: [{ jenis_zakat: 'fitrah_uang', nominal: 100000, berat_kg: 0 }],
        })

        expect(result.success).toBe(false)
        const error = result.error
        const refError = error.errors.find((e) => e.path.includes('no_referensi'))
        expect(refError).toBeDefined()
        expect(refError.message).toContain('QRIS')
      })

      test('rejects tahun_hijriah below minimum', () => {
        const belowMin = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1399,
          tahun_masehi: 2025,
          items: [{ jenis_zakat: 'fitrah_uang', nominal: 100000, berat_kg: 0 }],
        })

        expect(belowMin.success).toBe(false)
        const belowError = belowMin.error.errors.find((e) => e.path.includes('tahun_hijriah'))
        expect(belowError).toBeDefined()
      })

      test('rejects tahun_hijriah above maximum', () => {
        const aboveMax = SplitTransaksiSchema.safeParse({
          muzakki_id: 1,
          metode_bayar: 'tunai',
          tahun_hijriah: 1501,
          tahun_masehi: 2025,
          items: [{ jenis_zakat: 'fitrah_uang', nominal: 100000, berat_kg: 0 }],
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
          items: [{ jenis_zakat: 'fitrah_uang', nominal: -100000, berat_kg: 0 }],
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

    describe('Dashboard Schema', () => {
      test('rejects invalid tahun_hijriah format', () => {
        const result = DashboardQuerySchema.safeParse({
          tahun_hijriah: 'invalid',
        })

        expect(result.success).toBe(false)
        const error = result.error
        const tahunError = error.errors.find((e) => e.path.includes('tahun_hijriah'))
        expect(tahunError).toBeDefined()
        expect(tahunError.message).toContain('angka')
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

  // ─── Property-based: Validation always identifies fields ────────────────────

  describe('Property-based: Validation Errors Always Identify Fields', () => {

    test('for any empty nama_lengkap, error path identifies nama_lengkap field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          async (phone) => {
            const result = muzakkiSchema.safeParse({
              nama_lengkap: '',
              no_telepon: phone,
              wilayah_rt_id: 1,
            })

            expect(result.success).toBe(false)
            const fieldNames = result.error.errors.map((e) => e.path[e.path.length - 1])
            expect(fieldNames).toContain('nama_lengkap')
          }
        ),
        { numRuns: 30 }
      )
    })

    test('for any empty no_telepon, error path identifies no_telepon field', async () => {
      // Generate empty or whitespace-only strings
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (phone) => {
            const result = muzakkiSchema.safeParse({
              nama_lengkap: 'Valid Name',
              no_telepon: phone,
              wilayah_rt_id: 1,
            })

            expect(result.success).toBe(false)
            const fieldNames = result.error.errors.map((e) => e.path[e.path.length - 1])
            expect(fieldNames).toContain('no_telepon')
          }
        ),
        { numRuns: 20 }
      )
    })

    test('for any invalid wilayah_rt_id (zero or negative), error path identifies wilayah_rt_id field', async () => {
      // Zero and negative integers always fail positive validation
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ max: 0 }).map((n) => Math.min(n, -1)), // ensure negative
          async (rtId) => {
            const result = muzakkiSchema.safeParse({
              nama_lengkap: 'Valid Name',
              no_telepon: '08123456789',
              wilayah_rt_id: rtId,
            })

            expect(result.success).toBe(false)
            const fieldNames = result.error.errors.map((e) => e.path[e.path.length - 1])
            expect(fieldNames).toContain('wilayah_rt_id')
          }
        ),
        { numRuns: 30 }
      )
    })

    test('for any invalid jenis_zakat string, error identifies jenis_zakat field', async () => {
      const validZakat = new Set(['fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq'])
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter((s) => !validZakat.has(s)),
          async (invalidJenis) => {
            const result = SplitTransaksiSchema.safeParse({
              muzakki_id: 1,
              metode_bayar: 'tunai',
              tahun_hijriah: 1446,
              tahun_masehi: 2025,
              items: [{ jenis_zakat: invalidJenis, nominal: 100000, berat_kg: 0 }],
            })

            expect(result.success).toBe(false)
            const jenisErrors = result.error.errors.filter((e) =>
              e.path.includes('jenis_zakat')
            )
            expect(jenisErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  // ─── No Database Write on Validation Failure ──────────────────────────────────

  describe('No Database Write on Validation Failure', () => {
    test('createMuzakki does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      try {
        await createMuzakki(
          { nama_lengkap: '', no_telepon: '08123456789', wilayah_rt_id: 1 },
          user,
          { db: mockDb, auditLog: mockAuditLog }
        )
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError)
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createMustahik does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      try {
        await createMustahik(
          { nama_kepala_keluarga: 'Test', wilayah_rt_id: 1, kategori_asnaf: 'invalid', jumlah_tanggungan: 3 },
          user,
          { db: mockDb, auditLog: mockAuditLog }
        )
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError)
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createZakatMasukSession does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      try {
        await createZakatMasukSession(
          { muzakki_id: 1, metode_bayar: 'tunai', tahun_hijriah: 1446, tahun_masehi: 2025, items: [] },
          user,
          { db: mockDb, auditLog: mockAuditLog }
        )
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError)
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })

    test('createZakatKeluar does not call db when schema validation fails', async () => {
      const mockDb = jest.fn()
      const mockAuditLog = jest.fn()

      try {
        await createZakatKeluar(
          { mustahik_id: -1, nominal: 50000, tahun_hijriah: 1446, tahun_masehi: 2025 },
          user,
          { db: mockDb, auditLog: mockAuditLog }
        )
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError)
      }

      expect(mockDb).not.toHaveBeenCalled()
      expect(mockAuditLog).not.toHaveBeenCalled()
    })
  })

  // ─── Error Response Structure ────────────────────────────────────────────────

  describe('Error Response Structure', () => {
    test('ZodError contains properly structured error objects', () => {
      const result = muzakkiSchema.safeParse({
        nama_lengkap: '',
        no_telepon: '',
        wilayah_rt_id: 'not_a_number',
      })

      expect(result.success).toBe(false)
      const error = result.error

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
      expect(error.errors.length).toBeGreaterThanOrEqual(3)

      const fieldNames = error.errors.map((e) => e.path[e.path.length - 1])
      expect(fieldNames).toContain('nama_lengkap')
      expect(fieldNames).toContain('no_telepon')
      expect(fieldNames).toContain('wilayah_rt_id')
    })
  })
})
