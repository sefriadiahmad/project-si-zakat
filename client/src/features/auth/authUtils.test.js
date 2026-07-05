import assert from 'node:assert/strict'
import test from 'node:test'
import fc from 'fast-check'
import {
  REFRESH_THRESHOLD_SECONDS,
  isRoleAllowed,
  isTokenExpired,
  isTokenWithinRefreshWindow,
  shouldRedirectUnauthenticated,
} from './authUtils.js'

function base64Url(value) {
  return Buffer
    .from(JSON.stringify(value))
    .toString('base64url')
}

function makeToken(payload) {
  return `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url(payload)}.signature`
}

test('Property 2: protected routes reject unauthenticated access', () => {
  fc.assert(
    fc.property(
      fc.webPath().filter((path) => path !== '/' && path !== '/login'),
      (pathname) => {
        assert.equal(shouldRedirectUnauthenticated({ token: null, pathname }), true)
      },
    ),
  )
})

test('public login and root paths do not redirect because of missing token', () => {
  assert.equal(shouldRedirectUnauthenticated({ token: null, pathname: '/' }), false)
  assert.equal(shouldRedirectUnauthenticated({ token: null, pathname: '/login' }), false)
})

test('expired tokens reject protected route access', () => {
  const token = makeToken({ exp: 100 })

  assert.equal(isTokenExpired(token, 101), true)
  assert.equal(shouldRedirectUnauthenticated({ token, pathname: '/dashboard' }), true)
})

test('Property 3: token refresh window matches the 30 minute threshold', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1_700_000_000, max: 2_000_000_000 }),
      fc.integer({ min: 1, max: REFRESH_THRESHOLD_SECONDS - 1 }),
      (nowSeconds, remainingSeconds) => {
        const token = makeToken({ exp: nowSeconds + remainingSeconds })

        assert.equal(isTokenWithinRefreshWindow(token, nowSeconds), true)
      },
    ),
  )
})

test('tokens outside the refresh window are not flagged for refresh', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1_700_000_000, max: 2_000_000_000 }),
      fc.integer({ min: REFRESH_THRESHOLD_SECONDS, max: REFRESH_THRESHOLD_SECONDS * 4 }),
      (nowSeconds, remainingSeconds) => {
        const token = makeToken({ exp: nowSeconds + remainingSeconds })

        assert.equal(isTokenWithinRefreshWindow(token, nowSeconds), false)
      },
    ),
  )
})

test('role checks allow unrestricted routes and enforce admin-only routes', () => {
  assert.equal(isRoleAllowed({ role: 'kasir_amil' }), true)
  assert.equal(isRoleAllowed({ role: 'admin_masjid' }, ['admin_masjid']), true)
  assert.equal(isRoleAllowed({ role: 'kasir_amil' }, ['admin_masjid']), false)
})
