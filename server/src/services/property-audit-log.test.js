/**
 * Property 17: Audit Log Created for Every Mutation
 *
 * For any CREATE, UPDATE, or DELETE operation successfully committed to the database
 * through the API, a corresponding row SHALL be inserted into audit_log with the
 * correct operasi, nama_tabel, record_id, and user_id values within the same
 * database transaction.
 *
 * Validates: Requirements 11.4
 */

import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'

// Import services
import { createMuzakki, updateMuzakki, toggleMuzakkiStatus } from './muzakki.service.js'
import { createMustahik, verifikasiMustahik } from './mustahik.service.js'
import { createZakatMasukSession } from './zakat.service.js'
import { createZakatKeluar } from './distribusi.service.js'

// Helper: inject checkPhone mock to return null (no existing phone)
const nullCheckPhone = () => Promise.resolve(null)
const nullCheckPhoneExcludingId = () => Promise.resolve(null)

const user = { id: 42 }

const validMuzakkiData = {
  nama_lengkap: 'Test Muzakki',
  no_telepon: '08123456789',
  wilayah_rt_id: 1,
}

const newMuzakkiRecord = { id: 1, ...validMuzakkiData }

const validMustahikData = {
  nama_kepala_keluarga: 'Test Mustahik',
  wilayah_rt_id: 1,
  kategori_asnaf: 'fakir',
  jumlah_tanggungan: 3,
}

const newMustahikRecord = {
  id: 1,
  nama_kepala_keluarga: 'Test Mustahik',
  wilayah_rt_id: 1,
  kategori_asnaf: 'fakir',
  jumlah_tanggungan: 3,
  status_verifikasi: 'menunggu',
}

// Main mock factory - returns db function that handles both direct queries and transaction
function makeMockDb(insertResult) {
  const state = {
    _isPhoneCheck: false,
    _existingRecord: null,
    _insertedRows: null, // Will be set by insert() or update()
    _precomputedResult: Array.isArray(insertResult) ? insertResult : [insertResult],
  }

  const chainable = {
    where: function (col) {
      if (col && col.no_telepon !== undefined) {
        state._isPhoneCheck = true
      }
      return chainable
    },
    whereNot: function () { return chainable },
    first: function () {
      if (state._isPhoneCheck) return null
      if (state._existingRecord) return state._existingRecord
      return (state._precomputedResult && state._precomputedResult[0]) ? state._precomputedResult[0] : null
    },
    insert: function (rows) {
      state._insertedRows = state._precomputedResult || (Array.isArray(rows) ? rows : [rows])
      return chainable
    },
    update: function (payload) {
      // For update: return the existing record updated with payload (simulating DB behavior)
      state._insertedRows = state._existingRecord ? [state._existingRecord] : (state._precomputedResult || [])
      return chainable
    },
    returning: function () { return Promise.resolve(state._insertedRows) },
    then: function (cb) { return Promise.resolve(state._insertedRows).then(cb) },
    fn: { now: function () { return new Date().toISOString() } },
  }

  // setExistingRecord for update tests
  chainable.setExistingRecord = (rec) => { state._existingRecord = rec }

  // db function returns chainable for direct queries (e.g., checkPhone)
  const db = function (table) { return chainable }
  // transaction passes trx (callable) to callback
  db.transaction = function (cb) {
    const trxFn = function (tbl) { return chainable }
    trxFn._chainable = chainable
    // Note: fn.now() is no longer used in verifikasiMustahik, using new Date() instead
    trxFn.fn = { now: function () { return new Date().toISOString() } }
    return cb(trxFn)
  }
  db.fn = { now: function () { return new Date().toISOString() } }

  return { db, chainable }
}

describe('Property 17: Audit Log Created for Every Mutation', () => {

  test('createMuzakki: auditLog called with CREATE operation and correct table name', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const { db } = makeMockDb([newMuzakkiRecord])

    await createMuzakki(validMuzakkiData, user, { db, auditLog: auditLogTrx, checkPhone: nullCheckPhone })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, capturedUserId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('CREATE')
    expect(namaTabel).toBe('muzakki')
    expect(recordId).toBe(1)
    expect(capturedUserId).toBe(user.id)
  })

  test('updateMuzakki: auditLog called with UPDATE operation and correct table name', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const existingRecord = { id: 1, ...validMuzakkiData }
    const mock = makeMockDb([existingRecord])
    const { db, chainable } = mock
    chainable.setExistingRecord(existingRecord)

    await updateMuzakki(1, validMuzakkiData, user, { db, auditLog: auditLogTrx, checkPhoneExcludingId: nullCheckPhoneExcludingId })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, capturedUserId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('UPDATE')
    expect(namaTabel).toBe('muzakki')
    expect(recordId).toBe(1)
    expect(capturedUserId).toBe(user.id)
  })

  test('toggleMuzakkiStatus: auditLog called with UPDATE operation', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const existingRecord = { id: 1, ...validMuzakkiData, is_active: true }
    const mock = makeMockDb([existingRecord])
    const { db, chainable } = mock
    chainable.setExistingRecord(existingRecord)

    await toggleMuzakkiStatus(1, false, user, { db, auditLog: auditLogTrx })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, capturedUserId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('UPDATE')
    expect(namaTabel).toBe('muzakki')
    expect(recordId).toBe(1)
    expect(payload).toEqual({ is_active: false })
    expect(capturedUserId).toBe(user.id)
  })

  test('createMustahik: auditLog called with CREATE for mustahik_asnaf table', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const { db } = makeMockDb([newMustahikRecord])

    await createMustahik(validMustahikData, user, { db, auditLog: auditLogTrx })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, capturedUserId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('CREATE')
    expect(namaTabel).toBe('mustahik_asnaf')
    expect(recordId).toBe(1)
    expect(capturedUserId).toBe(user.id)
  })

  test('verifikasiMustahik (accept): auditLog called with UPDATE operation', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const existingMustahik = { id: 1, nama_kepala_keluarga: 'Test', status_verifikasi: 'menunggu' }
    const verifiedRecord = { ...existingMustahik, status_verifikasi: 'terverifikasi', verified_by: 42 }
    const mock = makeMockDb([verifiedRecord])
    const { db, chainable } = mock
    chainable.setExistingRecord(existingMustahik)

    await verifikasiMustahik(1, { status_verifikasi: 'terverifikasi' }, user, { db, auditLog: auditLogTrx })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, , operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('UPDATE')
    expect(namaTabel).toBe('mustahik_asnaf')
    expect(recordId).toBe(1)
  })

  test('verifikasiMustahik (reject): auditLog called with UPDATE and rejection payload', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const existingMustahik = { id: 1, nama_kepala_keluarga: 'Test', status_verifikasi: 'menunggu' }
    const rejectedRecord = { ...existingMustahik, status_verifikasi: 'ditolak', alasan_penolakan: 'Data tidak valid' }
    const mock = makeMockDb([rejectedRecord])
    const { db, chainable } = mock
    chainable.setExistingRecord(existingMustahik)

    await verifikasiMustahik(1, { status_verifikasi: 'ditolak', alasan_penolakan: 'Data tidak valid' }, user, { db, auditLog: auditLogTrx })

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, , operasi, , recordId, payload] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('UPDATE')
    expect(recordId).toBe(1)
    expect(payload.status_verifikasi).toBe('ditolak')
  })

  test('createZakatMasukSession: auditLog called once per item in session', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const insertedItems = [
      { id: 10, session_id: 'abc-uuid', jenis_zakat: 'fitrah_uang', nominal: 100000 },
      { id: 11, session_id: 'abc-uuid', jenis_zakat: 'fitrah_beras', berat_kg: 2.5 },
    ]

    const { db } = makeMockDb(insertedItems)

    await createZakatMasukSession({
      muzakki_id: 1,
      metode_bayar: 'tunai',
      tahun_hijriah: 1446,
      tahun_masehi: 2025,
      items: [
        { jenis_zakat: 'fitrah_uang', nominal: 100000, berat_kg: 0 },
        { jenis_zakat: 'fitrah_beras', berat_kg: 2.5, nominal: 0 },
      ],
    }, user, { db, auditLog: auditLogTrx })

    expect(auditLogTrx).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 2; i++) {
      const [, capturedUserId, operasi, namaTabel, recordId, payload] = auditLogTrx.mock.calls[i]
      expect(operasi).toBe('CREATE')
      expect(namaTabel).toBe('zakat_masuk')
      expect(capturedUserId).toBe(user.id)
      expect(payload).toBeDefined()
    }
  })

  test('createZakatKeluar: auditLog called with CREATE for zakat_keluar table', async () => {
    const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
    const newZakatKeluar = {
      id: 1,
      mustahik_id: 1,
      nominal: 50000,
      tahun_hijriah: 1446,
      tahun_masehi: 2025,
    }

    const { db } = makeMockDb([newZakatKeluar])

    await createZakatKeluar(
      { mustahik_id: 1, nominal: 50000, tahun_hijriah: 1446, tahun_masehi: 2025 },
      user,
      { db, auditLog: auditLogTrx }
    )

    expect(auditLogTrx).toHaveBeenCalledTimes(1)
    const [, capturedUserId, operasi, namaTabel, recordId] = auditLogTrx.mock.calls[0]
    expect(operasi).toBe('CREATE')
    expect(namaTabel).toBe('zakat_keluar')
    expect(recordId).toBe(1)
    expect(capturedUserId).toBe(user.id)
  })

  // ─── Property-based: Invariants ─────────────────────────────────────────────

  test('property: audit log operation is CREATE for any user ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),
        async (userId) => {
          const currentUser = { id: userId }
          const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
          const { db } = makeMockDb([newMuzakkiRecord])

          await createMuzakki(validMuzakkiData, currentUser, { db, auditLog: auditLogTrx, checkPhone: nullCheckPhone })

          const [, capturedUserId, operasi] = auditLogTrx.mock.calls[0]
          expect(operasi).toBe('CREATE')
          expect(capturedUserId).toBe(userId)
        }
      ),
      { numRuns: 20 }
    )
  })

  test('property: audit log record_id matches the created record ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 999 }),
        async (recordId) => {
          const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
          const record = { id: recordId, ...validMuzakkiData }
          const { db } = makeMockDb([record])

          await createMuzakki(validMuzakkiData, user, { db, auditLog: auditLogTrx, checkPhone: nullCheckPhone })

          const [, , , , capturedRecordId] = auditLogTrx.mock.calls[0]
          expect(capturedRecordId).toBe(recordId)
        }
      ),
      { numRuns: 20 }
    )
  })

  test('property: audit log table name is correct for each service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('createMuzakki', 'updateMuzakki', 'createMustahik'),
        async (serviceFn) => {
          const auditLogTrx = jest.fn().mockResolvedValue({ id: 1 })
          const tableNames = {
            createMuzakki: 'muzakki',
            updateMuzakki: 'muzakki',
            createMustahik: 'mustahik_asnaf',
          }

          if (serviceFn === 'createMuzakki') {
            const { db } = makeMockDb([newMuzakkiRecord])
            await createMuzakki(validMuzakkiData, user, { db, auditLog: auditLogTrx, checkPhone: nullCheckPhone })
          } else if (serviceFn === 'updateMuzakki') {
            const existingRecord = { id: 1, ...validMuzakkiData }
            const mock = makeMockDb([existingRecord])
            const { db, chainable } = mock
            chainable.setExistingRecord(existingRecord)
            await updateMuzakki(1, validMuzakkiData, user, { db, auditLog: auditLogTrx, checkPhoneExcludingId: nullCheckPhoneExcludingId })
          } else {
            const { db } = makeMockDb([newMustahikRecord])
            await createMustahik(validMustahikData, user, { db, auditLog: auditLogTrx })
          }

          const [, , , namaTabel] = auditLogTrx.mock.calls[0]
          expect(namaTabel).toBe(tableNames[serviceFn])
        }
      ),
      { numRuns: 15 }
    )
  })
})