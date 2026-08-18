import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../existing/context/AuthContext'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const role = searchParams.get('role') as 'CONSUMER' | 'VENDOR' | 'ADMIN' | null

    if (token && email && role) {
      login(token, { email, role })
      if (role === 'VENDOR') {
        navigate('/vendor/dashboard', { replace: true })
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/consumer/browse', { replace: true })
      }
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center text-[#f5f0e8] font-sans">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#E8B84B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-zinc-400">Authenticating with CineX...</p>
      </div>
    </div>
  )
}
