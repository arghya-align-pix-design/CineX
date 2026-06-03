import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const location  = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function RoleRoute({ role, children }) {
  const { token, user } = useAuth()
  const location        = useLocation()
  if (!token)              return <Navigate to="/login" state={{ from: location }} replace />
  if (user?.role !== role) return <Navigate to="/login" replace />
  return children
}
