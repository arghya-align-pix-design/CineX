import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ---------------------------------------------------------------------------
// ProtectedRoute — requires any authenticated user
// ---------------------------------------------------------------------------
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, demoMode } = useAuth()
  const location = useLocation()

  const isDemo = demoMode || localStorage.getItem('cinex_demo_mode') === 'true'
  const isAuthenticated = user !== null || isDemo

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// RoleRoute — requires authenticated user with a specific role
// ---------------------------------------------------------------------------
export function RoleRoute({
  role,
  children,
}: {
  role: string
  children: ReactNode
}) {
  const { user, demoMode } = useAuth()
  const location = useLocation()

  const isDemo = demoMode || localStorage.getItem('cinex_demo_mode') === 'true'
  const isAuthenticated = user !== null || isDemo

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Allow recruiter demo users to view admin and vendor routes
  if (isDemo) {
    return <>{children}</>
  }

  if (user?.role !== role) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
