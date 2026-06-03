import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api, { setAuthToken } from '../api/axios'

const AuthContext = createContext(null)

type User = {
  id: number
  email: string
  role: 'CONSUMER' | 'VENDOR' | 'ADMIN'
}

type AuthContextType = {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<string>
  logout: () => void
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]   = useState(null)
  const [user,  setUser]    = useState<User | null>(null) // { id, email, role: 'CONSUMER'|'VENDOR'|'ADMIN' }

  // Keep Axios interceptor in sync whenever token changes
  useEffect(() => { setAuthToken(token) }, [token])

  // Listen for 401 events fired by Axios interceptor
  useEffect(() => {
    const handle = () => { setToken(null); setUser(null) }
    window.addEventListener('cinex:unauthorized', handle)
    return () => window.removeEventListener('cinex:unauthorized', handle)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser({ id: data.userId, email: data.email, role: data.role })
    return data.role
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
