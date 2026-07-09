import db from '../db.js'
import { auditLog } from '../utils/auditLog.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import { hashPassword } from '../utils/password.js'

export async function getUsers(dependencies = {}) {
  const connection = dependencies.db || db

  const users = await connection('users')
    .select('id', 'username', 'full_name', 'role', 'is_active', 'created_at')
    .orderBy('created_at', 'desc')

  return users
}

export async function createUser(data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  // Check if username already exists
  const existing = await connection('users')
    .where('username', data.username)
    .first()

  if (existing) {
    throw new AppError('Username sudah digunakan', 400, ErrorCodes.VALIDATION_ERROR)
  }

  const passwordHash = await hashPassword(data.password)

  let newUser
  await connection.transaction(async (trx) => {
    const [inserted] = await trx('users')
      .insert({
        username: data.username,
        password_hash: passwordHash,
        full_name: data.full_name,
        role: data.role,
        is_active: true,
      })
      .returning(['id', 'username', 'full_name', 'role', 'is_active', 'created_at'])

    newUser = inserted
    await logMutation(trx, user.id, 'CREATE', 'users', inserted.id, inserted)
  })

  return newUser
}

export async function toggleUserStatus(id, isActive, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const existing = await connection('users').where({ id }).first()
  if (!existing) {
    throw new AppError('User tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  // Cannot toggle own status
  if (id === user.id) {
    throw new AppError('Tidak dapat mengubah status akun sendiri', 400, ErrorCodes.VALIDATION_ERROR)
  }

  await connection.transaction(async (trx) => {
    await trx('users').where({ id }).update({ is_active: isActive })
    await logMutation(trx, user.id, 'UPDATE', 'users', id, { is_active: isActive })
  })

  return { id, is_active: isActive }
}

export async function deleteUser(id, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const existing = await connection('users').where({ id }).first()
  if (!existing) {
    throw new AppError('User tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  // Cannot delete own account
  if (id === user.id) {
    throw new AppError('Tidak dapat menghapus akun sendiri', 400, ErrorCodes.VALIDATION_ERROR)
  }

  await connection.transaction(async (trx) => {
    await trx('users').where({ id }).del()
    await logMutation(trx, user.id, 'DELETE', 'users', id, existing)
  })

  return { success: true }
}
