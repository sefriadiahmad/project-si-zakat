import { describe, expect, test, jest } from '@jest/globals'
import { requireRole } from './authorize.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

function runMiddleware(middleware, req = {}) {
  const next = jest.fn()

  middleware(req, {}, next)

  return next
}

describe('requireRole', () => {
  test('allows a user with an allowed role', () => {
    const next = runMiddleware(requireRole(['admin_masjid']), {
      user: { id: 1, role: 'admin_masjid' },
    })

    expect(next).toHaveBeenCalledWith()
  })

  test('rejects unauthenticated access', () => {
    const next = runMiddleware(requireRole(['admin_masjid']))
    const error = next.mock.calls[0][0]

    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED)
  })

  test('rejects a user with a disallowed role', () => {
    const next = runMiddleware(requireRole(['admin_masjid']), {
      user: { id: 2, role: 'kasir_amil' },
    })
    const error = next.mock.calls[0][0]

    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe(ErrorCodes.FORBIDDEN)
  })
})
