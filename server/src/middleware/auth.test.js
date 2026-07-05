import { describe, expect, test } from '@jest/globals'
import { generateToken, getTimeRemaining, needsRefresh, verifyToken } from './auth.js'

describe('JWT auth helpers', () => {
  test('generates and verifies a token payload', () => {
    const token = generateToken({
      id: 1,
      username: 'admin',
      role: 'admin_masjid',
      fullName: 'Admin Masjid',
    })

    const decoded = verifyToken(token)

    expect(decoded.id).toBe(1)
    expect(decoded.username).toBe('admin')
    expect(decoded.role).toBe('admin_masjid')
  })

  test('detects tokens inside the refresh threshold', () => {
    const now = Math.floor(Date.now() / 1000)

    expect(needsRefresh({ exp: now + 60 })).toBe(true)
    expect(needsRefresh({ exp: now + 60 * 60 })).toBe(false)
  })

  test('returns remaining token lifetime in seconds', () => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = getTimeRemaining({ exp: now + 120 })

    expect(remaining).toBeGreaterThanOrEqual(119)
    expect(remaining).toBeLessThanOrEqual(120)
  })
})
