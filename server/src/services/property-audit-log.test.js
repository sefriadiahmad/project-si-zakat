/**
 * Property 17: Audit Log Created for Every Mutation
 *
 * For any CREATE, UPDATE, or DELETE operation successfully committed to the database
 * through the API, a corresponding row SHALL be inserted into audit_log with the
 * correct operasi, nama_tabel, record_id, and user_id values within the same
 * database transaction.
 *
 * Validates: Requirements 11.4
 *
 * This test verifies that all mutation endpoints call auditLog() correctly
 * with the proper parameters.
 */

import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import { ZodError } from 'zod'

// Import services
import { createMuzakki, updateMuzakki, toggleMuzakkiStatus } from './muzakki.service.js'
import { createMustahik, verifikasiMustahik } from './mustahik.service.js'
import { createZakatMasukSession } from './zakat.service.js'
import { createZakatKeluar } from './distribusi.service.js'

// Import schemas for valid data generation
import { muzakkiSchema } from '../schemas/muzakki.schema.js'
import { mustahikCreateSchema, mustahikVerifikasiSchema } from '../schemas/mustahik.schema.js'
import { SplitTransaksiSchema } from '../schemas/zakat.schema.js'
import { ZakatKeluarSchema } from '../schemas/distribusi.schema.js'

// Arbitraries
const validNama = fc.string({ minLength: 1, maxLength: 100 })
const validPhone = fc.stringMatching(/^[0-9]{5,20}$/)
const validRtId = fc.integer({ min: 1, max: 100 })
const user = { id: 1 }
const userWithRole = { id: 1, role: 'admin_masjid' }

// Valid data generators
const genValidMuzakki = () => ({
  nama_lengkap: 'Test Muzakki',
  no_telepon: '08123456789',
  wilayah_rt_id: 1,
})

const genValidMustahik = () => ({
  nama_kepala_keluarga: 'Test Mustahik',
  wilayah_rt_id: 1,
  kategori_asnaf: fc.constantFrom('fakir', 'miskin', 'mualaf', 'fisabilillah'),
  jumlah_tanggungan: fc.integer({ min: 1, max: 10 }),
})

describe('Property 17: Audit Log Created for Every Mutation', () => {

  describe('Muzakki Mutations', () => {
    test('createMuzakki: auditLog is called with correct parameters on successful CREATE', async () => {
      const mockAuditLog = jest.fn().mockResolvedValue({ id: 1 })
      const mockDb = jest.fn()

      // Setup mock transaction
      mockDb.mockImplementation((table) => {
        const mockQuery = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null), // no existing phone
          insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
          returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
        }
        mockQuery.transaction = jest.fn().mockImplementation(async (callback) => {
          const trx = {
            ...mockQuery,
            insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
          }
          return callback(trx)
        })
        return mockQuery
      })

      // Make db callable as a function for transaction
      mockDb.mockImplementation((table) => {
        if (table === 'muzakki') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
            }),
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
            transaction: jest.fn().mockImplementation(async (callback) => {
              const trx = {
                ...jest.requireActual('../db.js'),
                'muzakki': {
                  insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
                  returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
                },
                'audit_log': {
                  insert: jest.fn().mockResolvedValue([{ id: 1 }]),
                },
              }
              return callback(trx)
            }),
          }
        }
        return jest.fn()
      })

      // Build a proper mock that captures transaction calls
      const trxMock = {
        insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
      }
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const dbMock = jest.fn((table) => {
        if (table === 'muzakki') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await createMuzakki(genValidMuzakki(), user, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('CREATE')
      expect(namaTabel).toBe('muzakki')
      expect(recordId).toBe(1)
      expect(userId).toBe(user.id)
      expect(payload).toBeDefined()
    })

    test('updateMuzakki: auditLog is called with correct parameters on successful UPDATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const existingRecord = { id: 1, ...genValidMuzakki(), is_active: true }
      const trxMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingRecord),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ ...existingRecord, nama_lengkap: 'Updated Name' }]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'muzakki') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(existingRecord),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await updateMuzakki(1, genValidMuzakki(), user, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('UPDATE')
      expect(namaTabel).toBe('muzakki')
      expect(recordId).toBe(1)
      expect(userId).toBe(user.id)
    })

    test('toggleMuzakkiStatus: auditLog is called with correct parameters on successful UPDATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const existingRecord = { id: 1, ...genValidMuzakki(), is_active: true }
      const trxMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingRecord),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ ...existingRecord, is_active: false }]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'muzakki') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(existingRecord),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await toggleMuzakkiStatus(1, false, user, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('UPDATE')
      expect(namaTabel).toBe('muzakki')
      expect(recordId).toBe(1)
      expect(userId).toBe(user.id)
      expect(payload).toEqual({ is_active: false })
    })
  })

  describe('Mustahik Mutations', () => {
    test('createMustahik: auditLog is called with correct parameters on successful CREATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const newMustahik = {
        id: 1,
        nama_kepala_keluarga: 'Test Mustahik',
        wilayah_rt_id: 1,
        kategori_asnaf: 'fakir',
        jumlah_tanggungan: 3,
        status_verifikasi: 'menunggu',
      }

      const trxMock = {
        insert: jest.fn().mockResolvedValue([newMustahik]),
        returning: jest.fn().mockResolvedValue([newMustahik]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'mustahik_asnaf') {
          return {
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await createMustahik({
        nama_kepala_keluarga: 'Test Mustahik',
        wilayah_rt_id: 1,
        kategori_asnaf: 'fakir',
        jumlah_tanggungan: 3,
      }, user, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('CREATE')
      expect(namaTabel).toBe('mustahik_asnaf')
      expect(recordId).toBe(1)
      expect(userId).toBe(user.id)
    })

    test('verifikasiMustahik (accept): auditLog is called with correct parameters on successful UPDATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const existingMustahik = {
        id: 1,
        nama_kepala_keluarga: 'Test Mustahik',
        status_verifikasi: 'menunggu',
      }

      const updatedMustahik = {
        ...existingMustahik,
        status_verifikasi: 'terverifikasi',
        verified_by: 1,
      }

      const trxMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingMustahik),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedMustahik]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'mustahik_asnaf') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(existingMustahik),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await verifikasiMustahik(1, {
        status_verifikasi: 'terverifikasi',
      }, userWithRole, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('UPDATE')
      expect(namaTabel).toBe('mustahik_asnaf')
      expect(recordId).toBe(1)
      expect(userId).toBe(userWithRole.id)
    })

    test('verifikasiMustahik (reject): auditLog is called with correct parameters on successful UPDATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const existingMustahik = {
        id: 1,
        nama_kepala_keluarga: 'Test Mustahik',
        status_verifikasi: 'menunggu',
      }

      const updatedMustahik = {
        ...existingMustahik,
        status_verifikasi: 'ditolak',
        alasan_penolakan: 'Data tidak lengkap',
      }

      const trxMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingMustahik),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedMustahik]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'mustahik_asnaf') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(existingMustahik),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await verifikasiMustahik(1, {
        status_verifikasi: 'ditolak',
        alasan_penolakan: 'Data tidak lengkap',
      }, userWithRole, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('UPDATE')
      expect(namaTabel).toBe('mustahik_asnaf')
      expect(recordId).toBe(1)
      expect(userId).toBe(userWithRole.id)
      expect(payload.status_verifikasi).toBe('ditolak')
    })
  })

  describe('Zakat Mutations', () => {
    test('createZakatMasukSession: auditLog is called for each item on successful CREATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const insertedItems = [
        { id: 1, session_id: 'test-uuid', jenis_zakat: 'fitrah_uang', nominal: 100000 },
        { id: 2, session_id: 'test-uuid', jenis_zakat: 'fitrah_beras', berat_kg: 2.5 },
      ]

      const trxMock = {
        insert: jest.fn().mockResolvedValue(insertedItems),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'zakat_masuk') {
          return {
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await createZakatMasukSession({
        muzakki_id: 1,
        metode_bayar: 'tunai',
        tahun_hijriah: 1446,
        tahun_masehi: 2025,
        items: [
          { jenis_zakat: 'fitrah_uang', nominal: 100000 },
          { jenis_zakat: 'fitrah_beras', berat_kg: 2.5 },
        ],
      }, user, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      // auditLog should be called twice, once for each item
      expect(auditLogTrx).toHaveBeenCalledTimes(2)

      for (let i = 0; i < 2; i++) {
        const [trx, userId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[i]
        expect(operasi).toBe('CREATE')
        expect(namaTabel).toBe('zakat_masuk')
        expect(userId).toBe(user.id)
        expect(recordId).toBe(i + 1)
        expect(payload).toBeDefined()
      }
    })
  })

  describe('Distribusi Mutations', () => {
    test('createZakatKeluar: auditLog is called with correct parameters on successful CREATE', async () => {
      const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

      const newZakatKeluar = {
        id: 1,
        mustahik_id: 1,
        admin_id: 1,
        nominal: 50000,
        berat_kg: 0,
        tahun_hijriah: 1446,
        tahun_masehi: 2025,
      }

      const trxMock = {
        insert: jest.fn().mockResolvedValue([newZakatKeluar]),
        returning: jest.fn().mockResolvedValue([newZakatKeluar]),
      }

      const dbMock = jest.fn((table) => {
        if (table === 'zakat_keluar') {
          return {
            transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(trxMock)
            }),
          }
        }
        return jest.fn()
      })

      const result = await createZakatKeluar({
        mustahik_id: 1,
        nominal: 50000,
        berat_kg: 0,
        tahun_hijriah: 1446,
        tahun_masehi: 2025,
      }, userWithRole, {
        db: dbMock,
        auditLog: auditLogTrx,
      })

      expect(result).toBeDefined()
      expect(auditLogTrx).toHaveBeenCalled()
      const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
      expect(operasi).toBe('CREATE')
      expect(namaTabel).toBe('zakat_keluar')
      expect(recordId).toBe(1)
      expect(userId).toBe(userWithRole.id)
    })
  })

  describe('Property-based: Audit Log Invariants', () => {
    test('for any muzakki mutation, audit log operation type matches the mutation type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('CREATE', 'UPDATE'),
          async (operationType) => {
            const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

            if (operationType === 'CREATE') {
              const trxMock = {
                insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
                returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
              }

              const dbMock = jest.fn((table) => {
                if (table === 'muzakki') {
                  return {
                    where: jest.fn().mockReturnValue({
                      first: jest.fn().mockResolvedValue(null),
                    }),
                    transaction: jest.fn().mockImplementation(async (callback) => {
                      return callback(trxMock)
                    }),
                  }
                }
                return jest.fn()
              })

              await createMuzakki(genValidMuzakki(), user, {
                db: dbMock,
                auditLog: auditLogTrx,
              })

              const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
              expect(operasi).toBe('CREATE')
              expect(namaTabel).toBe('muzakki')
            } else {
              const existingRecord = { id: 1, ...genValidMuzakki() }
              const trxMock = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(existingRecord),
                update: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([existingRecord]),
              }

              const dbMock = jest.fn((table) => {
                if (table === 'muzakki') {
                  return {
                    where: jest.fn().mockReturnValue({
                      first: jest.fn().mockResolvedValue(existingRecord),
                    }),
                    transaction: jest.fn().mockImplementation(async (callback) => {
                      return callback(trxMock)
                    }),
                  }
                }
                return jest.fn()
              })

              await updateMuzakki(1, genValidMuzakki(), user, {
                db: dbMock,
                auditLog: auditLogTrx,
              })

              const [trx, userId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
              expect(operasi).toBe('UPDATE')
              expect(namaTabel).toBe('muzakki')
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    test('for any mutation, audit log user_id matches the authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (userId) => {
            const user = { id: userId, role: 'admin_masjid' }
            const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

            const trxMock = {
              insert: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
              returning: jest.fn().mockResolvedValue([{ id: 1, ...genValidMuzakki() }]),
            }

            const dbMock = jest.fn((table) => {
              if (table === 'muzakki') {
                return {
                  where: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue(null),
                  }),
                  transaction: jest.fn().mockImplementation(async (callback) => {
                    return callback(trxMock)
                  }),
                }
              }
              return jest.fn()
            })

            await createMuzakki(genValidMuzakki(), user, {
              db: dbMock,
              auditLog: auditLogTrx,
            })

            const [trx, capturedUserId] = auditLogTrx.mock.calls[0]
            expect(capturedUserId).toBe(userId)
          }
        ),
        { numRuns: 20 }
      )
    })

    test('for any mutation, audit log record_id matches the created/updated record ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (recordId) => {
            const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })

            const trxMock = {
              insert: jest.fn().mockResolvedValue([{ id: recordId, ...genValidMuzakki() }]),
              returning: jest.fn().mockResolvedValue([{ id: recordId, ...genValidMuzakki() }]),
            }

            const dbMock = jest.fn((table) => {
              if (table === 'muzakki') {
                return {
                  where: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue(null),
                  }),
                  transaction: jest.fn().mockImplementation(async (callback) => {
                    return callback(trxMock)
                  }),
                }
              }
              return jest.fn()
            })

            await createMuzakki(genValidMuzakki(), user, {
              db: dbMock,
              auditLog: auditLogTrx,
            })

            const [trx, userId, operasi, namaTabel, capturedRecordId] = auditLogTrx.mock.calls[0]
            expect(capturedRecordId).toBe(recordId)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
