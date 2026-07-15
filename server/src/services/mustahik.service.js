import db from '../db.js'
import {
  mustahikCreateSchema,
  mustahikVerifikasiSchema,
  mustahikListQuerySchema,
} from '../schemas/mustahik.schema.js'
import { auditLog } from '../utils/auditLog.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export async function getMustahikList(queryParams, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = mustahikListQuerySchema.parse(queryParams)
  const { search, status_verifikasi, kategori_asnaf, wilayah_rt_id, sortBy, sortOrder, page, limit } = parsed

  let baseQuery = connection('mustahik_asnaf').join(
    'wilayah_rt',
    'mustahik_asnaf.wilayah_rt_id',
    'wilayah_rt.id'
  )

  // Search by nama_kepala_keluarga
  if (search) {
    baseQuery = baseQuery.where('mustahik_asnaf.nama_kepala_keluarga', 'ilike', `%${search}%`)
  }

  if (status_verifikasi) {
    baseQuery = baseQuery.where('mustahik_asnaf.status_verifikasi', status_verifikasi)
  }

  if (kategori_asnaf) {
    baseQuery = baseQuery.where('mustahik_asnaf.kategori_asnaf', kategori_asnaf)
  }

  if (wilayah_rt_id) {
    baseQuery = baseQuery.where('mustahik_asnaf.wilayah_rt_id', wilayah_rt_id)
  }

  const totalQuery = await baseQuery.clone().count('* as total').first()
  const total = parseInt(totalQuery?.total || 0, 10)
  const offset = (page - 1) * limit

  // Handle sorting
  const orderColumn = sortBy || 'created_at'
  const orderDirection = sortOrder || 'desc'

  const data = await baseQuery
    .select('mustahik_asnaf.*', 'wilayah_rt.nama_rt')
    .orderBy(`mustahik_asnaf.${orderColumn}`, orderDirection)
    .limit(limit)
    .offset(offset)

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function createMustahik(data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const parsed = mustahikCreateSchema.parse(data)

  let newMustahik
  await connection.transaction(async (trx) => {
    const [inserted] = await trx('mustahik_asnaf')
      .insert({
        nama_kepala_keluarga: parsed.nama_kepala_keluarga,
        wilayah_rt_id: parsed.wilayah_rt_id,
        kategori_asnaf: parsed.kategori_asnaf,
        jumlah_tanggungan: parsed.jumlah_tanggungan,
        dokumen_url: parsed.dokumen_url ?? null,
        status_verifikasi: 'menunggu',
      })
      .returning('*')

    newMustahik = inserted
    await logMutation(trx, user.id, 'CREATE', 'mustahik_asnaf', inserted.id, inserted)
  })

  return newMustahik
}

export async function verifikasiMustahik(id, data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  // Validate input
  const parsed = mustahikVerifikasiSchema.parse(data)

  // Check user has required fields
  if (!user || !user.id) {
    throw new AppError('Autentikasi diperlukan', 401, 'UNAUTHORIZED')
  }

  // Use ISO string for PostgreSQL compatibility
  const now = new Date().toISOString()

  let updatedMustahik
  await connection.transaction(async (trx) => {
    // Get existing record
    const record = await trx('mustahik_asnaf').where({ id }).first()
    if (!record) {
      throw new AppError('Mustahik tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
    }

    if (record.status_verifikasi !== 'menunggu') {
      throw new AppError(
        'Mustahik sudah diverifikasi atau ditolak sebelumnya',
        400,
        ErrorCodes.VALIDATION_ERROR
      )
    }

    const updatePayload =
      parsed.status_verifikasi === 'terverifikasi'
        ? {
            status_verifikasi: 'terverifikasi',
            verified_by: user.id,
            verified_at: now,
            alasan_penolakan: null,
            updated_at: now,
          }
        : {
            status_verifikasi: 'ditolak',
            alasan_penolakan: parsed.alasan_penolakan,
            verified_by: user.id,
            verified_at: now,
            updated_at: now,
          }

    const [inserted] = await trx('mustahik_asnaf')
      .where({ id })
      .update(updatePayload)
      .returning('*')

    updatedMustahik = inserted

    // Log payload tanpa timestamp circular reference
    const logPayload = {
      ...updatePayload,
      verified_at: now,
      updated_at: now,
    }
    await logMutation(trx, user.id, 'UPDATE', 'mustahik_asnaf', id, logPayload)
  })

  return updatedMustahik
}

export async function getMustahikById(id, dependencies = {}) {
  const connection = dependencies.db || db
  const record = await connection('mustahik_asnaf')
    .join('wilayah_rt', 'mustahik_asnaf.wilayah_rt_id', 'wilayah_rt.id')
    .select('mustahik_asnaf.*', 'wilayah_rt.nama_rt')
    .where('mustahik_asnaf.id', id)
    .first()

  if (!record) {
    throw new AppError('Mustahik tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  return record
}
