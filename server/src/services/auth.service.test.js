import { describe, expect, test, jest } from '@jest/globals'
import fc from 'fast-check'
import {
  INVALID_LOGIN_MESSAGE,
  login,
  refreshTokenForUser,
  toAuthUser,
} from './auth.service.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

const validCredentialString = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0)

describe('auth service', () => {
  test('maps database users to public auth users', () => {
    expect(toAuthUser({
      id: 1,
      username: 'admin',
      full_name: 'Admin Masjid',
      role: 'admin_masjid',
    })).toEqual({
      id: 1,
      username: 'admin',
      fullName: 'Admin Masjid',
      role: 'admin_masjid',
    })
  })

  test('Property 1: invalid credentials always produce the generic error', async () => {
    await fc.assert(
      fc.asyncProperty(validCredentialString, validCredentialString, async (username, password) => {
        await expect(login(
          { username, password },
          {
            findUserByUsername: async () => null,
            verifyPassword: async () => false,
            generateToken: jest.fn(),
          },
        )).rejects.toMatchObject({
          message: INVALID_LOGIN_MESSAGE,
          statusCode: 401,
          code: ErrorCodes.INVALID_CREDENTIALS,
        })
      }),
      { numRuns: 50 },
    )
  })

  test('returns the same generic error when the password is wrong', async () => {
    await expect(login(
      { username: 'admin', password: 'wrong-password' },
      {
        findUserByUsername: async () => ({
          id: 1,
          username: 'admin',
          full_name: 'Admin Masjid',
          role: 'admin_masjid',
          is_active: true,
          password_hash: 'hash',
        }),
        verifyPassword: async () => false,
        generateToken: jest.fn(),
      },
    )).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
      statusCode: 401,
      code: ErrorCodes.INVALID_CREDENTIALS,
    })
  })

  test('returns a token and public user for valid credentials', async () => {
    await expect(login(
      { username: 'admin', password: 'admin123' },
      {
        findUserByUsername: async () => ({
          id: 1,
          username: 'admin',
          full_name: 'Admin Masjid',
          role: 'admin_masjid',
          is_active: true,
          password_hash: 'hash',
        }),
        verifyPassword: async () => true,
        generateToken: () => 'signed-token',
      },
    )).resolves.toEqual({
      token: 'signed-token',
      user: {
        id: 1,
        username: 'admin',
        fullName: 'Admin Masjid',
        role: 'admin_masjid',
      },
    })
  })

  test('rejects inactive users with the generic credentials error', async () => {
    await expect(login(
      { username: 'admin', password: 'admin123' },
      {
        findUserByUsername: async () => ({
          id: 1,
          username: 'admin',
          full_name: 'Admin Masjid',
          role: 'admin_masjid',
          is_active: false,
          password_hash: 'hash',
        }),
        verifyPassword: async () => true,
      },
    )).rejects.toBeInstanceOf(AppError)
  })

  test('refreshTokenForUser issues a new token from req.user data', () => {
    expect(refreshTokenForUser(
      {
        id: 1,
        username: 'admin',
        role: 'admin_masjid',
        fullName: 'Admin Masjid',
      },
      { generateToken: (payload) => `token:${payload.username}:${payload.role}` },
    )).toBe('token:admin:admin_masjid')
  })
})
