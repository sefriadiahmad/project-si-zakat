import axios from 'axios'
import { getStoredAuth, storeAuth, clearStoredAuth } from '@features/auth/authUtils'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10_000,
})

// ─── Request Interceptor: Attach JWT token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const { token } = getStoredAuth()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ─── Response Interceptor: Handle X-Refresh-Token ────────────────────────────
api.interceptors.response.use(
  (response) => {
    const refreshToken = response.headers?.['x-refresh-token']

    if (refreshToken) {
      const { user } = getStoredAuth()

      if (user) {
        storeAuth(refreshToken, user)
      }
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    // ─── 401 Handler: Clear auth & redirect to login ─────────────────────────
    // Skip redirect if already on login page or if this was the logout request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !window.location.pathname.endsWith('/login')
    ) {
      originalRequest._retry = true

      // Don't call logout() API — just clear local state to avoid infinite loops
      clearStoredAuth()

      // Redirect to login preserving the current location
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`
    }

    return Promise.reject(error)
  }
)

export default api
