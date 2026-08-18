import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { setToken } from '../api/axios'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Role = 'CONSUMER' | 'VENDOR' | 'ADMIN'

interface User {
  email: string
  role: Role
  demoMode?: boolean
}

interface AuthContextType {
  token: string | null
  user: User | null
  demoMode: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('cinex_token')
  })
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('cinex_user')
    if (savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch {
        return null
      }
    }
    return null
  })
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('cinex_demo_mode') === 'true'
  })

  const login = useCallback((tok: string, u: User) => {
    setToken(tok)          // sync Axios interceptor
    setTokenState(tok)
    setUser(u)
    const isDemo = u.demoMode === true
    setDemoMode(isDemo)
    localStorage.setItem('cinex_token', tok)
    localStorage.setItem('cinex_user', JSON.stringify(u))
    localStorage.setItem('cinex_demo_mode', String(isDemo))
  }, [])

  const logout = useCallback(() => {
    setToken(null)         // sync Axios interceptor
    setTokenState(null)
    setUser(null)
    setDemoMode(false)
    localStorage.removeItem('cinex_token')
    localStorage.removeItem('cinex_user')
    localStorage.removeItem('cinex_demo_mode')
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, demoMode, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
