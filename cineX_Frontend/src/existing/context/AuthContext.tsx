import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import api from '../api/axios'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Role = 'CONSUMER' | 'VENDOR' | 'ADMIN'

export interface User {
  email: string
  role: Role
  demoMode?: boolean
}

interface AuthContextType {
  token: string | null
  user: User | null
  demoMode: boolean
  login: (userOrToken: User | string, possibleUser?: User) => void
  logout: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
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

  const login = useCallback((userOrToken: User | string, possibleUser?: User) => {
    let u: User
    if (typeof userOrToken === 'string') {
      u = possibleUser || { email: '', role: 'CONSUMER' }
    } else {
      u = userOrToken
    }

    setUser(u)
    const isDemo = u.demoMode === true
    setDemoMode(isDemo)
    localStorage.setItem('cinex_user', JSON.stringify(u))
    localStorage.setItem('cinex_demo_mode', String(isDemo))
    localStorage.removeItem('cinex_token') // Ensure old token is cleaned up
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore network errors on logout, proceed with client cleanup
    } finally {
      setUser(null)
      setDemoMode(false)
      localStorage.removeItem('cinex_user')
      localStorage.removeItem('cinex_demo_mode')
      localStorage.removeItem('cinex_token')
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token: user ? 'cookie-active' : null,
        user,
        demoMode,
        login,
        logout,
      }}
    >
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
