import db from '../db.js'
import { muzakkiSchema } from '../schemas/muzakki.schema.js'
import { auditLog } from '../utils/auditLog.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export async function getMuzakkiList(params, dependencies = {}) {
  const connection = dependencies.db || db
  const { search, wilayah_rt_id, sortBy = 'nama', sortOrder = 'asc', page = 1, limit = 10 } = params

  let baseQuery = connection('muzakki')
    .join('wilayah_rt', 'muzakki.wilayah_rt_id', 'wilayah_rt.id')

  if (search && search.trim() !== '') {
    const searchVal = `%${search.trim()}%`
    baseQuery = baseQuery.where(function () {
      this.where('muzakki.nama_lengkap', 'ilike', searchVal)
        .orWhere('muzakki.no_telepon', 'like', searchVal)
    })
  }

  if (wilayah_rt_id) {
    baseQuery = baseQuery.where('muzakki.wilayah_rt_id', parseInt(wilayah_rt_id))
  }

  const totalQuery = await baseQuery.clone().count('* as total').first()
  const total = parseInt(totalQuery?.total || 0)

  let orderColumn = 'muzakki.nama_lengkap'
  if (sortBy === 'rt') {
    orderColumn = 'wilayah_rt.nama_rt'
  } else if (sortBy === 'tanggal') {
    orderColumn = 'muzakki.created_at'
  }

  const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc'
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 10
  const offset = (pageNum - 1) * limitNum

  const data = await baseQuery
    .select('muzakki.*', 'wilayah_rt.nama_rt')
    .orderBy(orderColumn, orderDirection)
    .limit(limitNum)
    .offset(offset)

  return {
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

export async function createMuzakki(data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const parsed = muzakkiSchema.parse(data)

  const checkPhone = dependencies.checkPhone || (async (phone) => {
    return connection('muzakki').where({ no_telepon: phone }).first()
  })

  const existing = await checkPhone(parsed.no_telepon)
  if (existing) {
    throw new AppError('Nomor telepon sudah terdaftar untuk muzakki lain', 400, ErrorCodes.PHONE_EXISTS)
  }

  let newMuzakki
  await connection.transaction(async (trx) => {
    const [inserted] = await trx('muzakki')
      .insert({
        nama_lengkap: parsed.nama_lengkap,
        no_telepon: parsed.no_telepon,
        wilayah_rt_id: parsed.wilayah_rt_id,
        alamat_detail: parsed.alamat_detail,
        catatan: parsed.catatan,
        is_active: true,
      })
      .returning('*')

    newMuzakki = inserted
    await logMutation(trx, user.id, 'CREATE', 'muzakki', inserted.id, inserted)
  })

  return newMuzakki
}

export async function updateMuzakki(id, data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const parsed = muzakkiSchema.parse(data)

  const checkPhoneExcludingId = dependencies.checkPhoneExcludingId || (async (phone, mId) => {
    return connection('muzakki')
      .where({ no_telepon: phone })
      .whereNot({ id: mId })
      .first()
  })

  const existing = await checkPhoneExcludingId(parsed.no_telepon, id)
  if (existing) {
    throw new AppError('Nomor telepon sudah terdaftar untuk muzakki lain', 400, ErrorCodes.PHONE_EXISTS)
  }

  let updatedMuzakki
  await connection.transaction(async (trx) => {
    const record = await trx('muzakki').where({ id }).first()
    if (!record) {
      throw new AppError('Muzakki tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
    }

    const [inserted] = await trx('muzakki')
      .where({ id })
      .update({
        nama_lengkap: parsed.nama_lengkap,
        no_telepon: parsed.no_telepon,
        wilayah_rt_id: parsed.wilayah_rt_id,
        alamat_detail: parsed.alamat_detail,
        catatan: parsed.catatan,
        updated_at: connection.fn.now(),
      })
      .returning('*')

    updatedMuzakki = inserted
    await logMutation(trx, user.id, 'UPDATE', 'muzakki', id, inserted)
  })

  return updatedMuzakki
}

export async function toggleMuzakkiStatus(id, isActive, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  if (typeof isActive !== 'boolean') {
    throw new AppError('Field is_active harus berupa boolean', 400, ErrorCodes.VALIDATION_ERROR)
  }

  let updatedMuzakki
  await connection.transaction(async (trx) => {
    const record = await trx('muzakki').where({ id }).first()
    if (!record) {
      throw new AppError('Muzakki tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
    }

    const [inserted] = await trx('muzakki')
      .where({ id })
      .update({
        is_active: isActive,
        updated_at: connection.fn.now(),
      })
      .returning('*')

    updatedMuzakki = inserted
    await logMutation(trx, user.id, 'UPDATE', 'muzakki', id, { is_active: isActive })
  })

  return updatedMuzakki
}

export async function getMuzakkiById(id, dependencies = {}) {
  const connection = dependencies.db || db
  const record = await connection('muzakki').where({ id }).first()
  if (!record) {
    throw new AppError('Muzakki tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }
  return record
}
