import db from '../db.js'
import { loginSchema } from '../schemas/auth.schema.js'
import { generateToken } from '../middleware/auth.js'
import { verifyPassword } from '../utils/password.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export const INVALID_LOGIN_MESSAGE = 'Username atau password salah'

export function toAuthUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
  }
}

function invalidCredentialsError() {
  return new AppError(INVALID_LOGIN_MESSAGE, 401, ErrorCodes.INVALID_CREDENTIALS)
}

export async function findUserByUsername(username) {
  return db('users')
    .where({ username })
    .first()
}

export async function login(credentials, dependencies = {}) {
  const parsed = loginSchema.parse(credentials)
  const findUser = dependencies.findUserByUsername || findUserByUsername
  const verify = dependencies.verifyPassword || verifyPassword
  const issueToken = dependencies.generateToken || generateToken

  const user = await findUser(parsed.username)

  if (!user || !user.is_active) {
    throw invalidCredentialsError()
  }

  const passwordValid = await verify(parsed.password, user.password_hash)

  if (!passwordValid) {
    throw invalidCredentialsError()
  }

  const authUser = toAuthUser(user)
  const token = issueToken(authUser)

  return { token, user: authUser }
}

export function refreshTokenForUser(user, dependencies = {}) {
  const issueToken = dependencies.generateToken || generateToken

  return issueToken({
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  })
}
