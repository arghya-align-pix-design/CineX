import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../existing/context/AuthContext'
import api from '../existing/api/axios'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    let isMounted = true

    api
      .post('/auth/oauth2/exchange', { code })
      .then(({ data }) => {
        if (!isMounted) return
        login({ email: data.email || 'oauth@cinex.com', role: data.role || 'CONSUMER' })

        if (data.role === 'VENDOR') {
          navigate('/vendor/dashboard', { replace: true })
        } else if (data.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/consumer/browse', { replace: true })
        }
      })
      .catch(() => {
        if (isMounted) {
          navigate('/login?error=oauth_failed', { replace: true })
        }
      })

    return () => {
      isMounted = false
    }
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center text-[#f5f0e8] font-sans">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#E8B84B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-zinc-400">Authenticating securely with CineX...</p>
      </div>
    </div>
  )
}
