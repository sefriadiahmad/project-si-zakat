import axios from 'axios'
import { getStoredAuth, storeAuth } from '@features/auth/authUtils'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const { token } = getStoredAuth()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use((response) => {
  const refreshToken = response.headers?.['x-refresh-token']

  if (refreshToken) {
    const { user } = getStoredAuth()

    if (user) {
      storeAuth(refreshToken, user)
    }
  }

  return response
})

export default api
