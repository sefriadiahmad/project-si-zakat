import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api from '@shared/lib/api'
import {
  clearStoredAuth,
  getStoredAuth,
  isTokenExpired,
  storeAuth,
} from './authUtils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth())

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    const nextAuth = {
      token: response.data.token,
      user: response.data.user,
    }

    storeAuth(nextAuth.token, nextAuth.user)
    setAuth(nextAuth)

    return nextAuth
  }, [])

  const logout = useCallback(async () => {
    try {
      if (auth.token && !isTokenExpired(auth.token)) {
        await api.post('/auth/logout')
      }
    } finally {
      clearStoredAuth()
      setAuth({ token: null, user: null })
    }
  }, [auth.token])

  const value = useMemo(() => ({
    token: auth.token,
    user: auth.user,
    isAuthenticated: Boolean(auth.token && !isTokenExpired(auth.token)),
    login,
    logout,
    setAuth,
  }), [auth.token, auth.user, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }

  return context
}
