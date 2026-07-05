const TOKEN_KEY = 'zakat_auth_token'
const USER_KEY = 'zakat_auth_user'
const REFRESH_THRESHOLD_SECONDS = 30 * 60

export function getStoredAuth(storage = window.localStorage) {
  const token = storage.getItem(TOKEN_KEY)
  const userValue = storage.getItem(USER_KEY)

  if (!token || !userValue) {
    return { token: null, user: null }
  }

  try {
    return { token, user: JSON.parse(userValue) }
  } catch {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
}

export function storeAuth(token, user, storage = window.localStorage) {
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredAuth(storage = window.localStorage) {
  storage.removeItem(TOKEN_KEY)
  storage.removeItem(USER_KEY)
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = atob(padded)

    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function isTokenExpired(token, nowSeconds = Math.floor(Date.now() / 1000)) {
  const payload = decodeJwtPayload(token)

  if (!payload?.exp) {
    return true
  }

  return payload.exp <= nowSeconds
}

export function isTokenWithinRefreshWindow(
  token,
  nowSeconds = Math.floor(Date.now() / 1000),
  thresholdSeconds = REFRESH_THRESHOLD_SECONDS,
) {
  const payload = decodeJwtPayload(token)

  if (!payload?.exp) {
    return false
  }

  const remainingSeconds = payload.exp - nowSeconds

  return remainingSeconds > 0 && remainingSeconds < thresholdSeconds
}

export function shouldRedirectUnauthenticated({ token, pathname }) {
  if (pathname === '/' || pathname === '/login') {
    return false
  }

  return !token || isTokenExpired(token)
}

export function isRoleAllowed(user, allowedRoles) {
  if (!allowedRoles?.length) {
    return true
  }

  return Boolean(user?.role && allowedRoles.includes(user.role))
}

export { TOKEN_KEY, USER_KEY, REFRESH_THRESHOLD_SECONDS }
