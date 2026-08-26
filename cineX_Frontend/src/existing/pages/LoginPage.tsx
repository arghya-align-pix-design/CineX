import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface LoginResponse {
  token: string
  role: 'CONSUMER' | 'VENDOR' | 'ADMIN'
  firstLogin: boolean
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Both fields are required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email: form.email,
        password: form.password,
      })
      login({ email: form.email, role: data.role })

      if (data.role === 'CONSUMER') navigate('/consumer/browse', { replace: true })
      else if (data.role === 'VENDOR') navigate('/vendor/dashboard', { replace: true })
      else if (data.role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Invalid email or password.'
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.')
      return
    }
    setForgotError('')
    setForgotSuccess('')
    setForgotLoading(true)
    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
        email: forgotEmail,
      })
      setForgotSuccess(data.message || 'Password reset link sent to your email.')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Email entered is not registered.'
      setForgotError(typeof msg === 'string' ? msg : 'Failed to request reset link.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse & { demoMode?: boolean }>('/auth/demo-login')
      login({ email: 'demo@cinex.com', role: data.role, demoMode: true })
      navigate('/demo', { replace: true })
    } catch (err: unknown) {
      // Fallback demo login for offline/local mode
      login({ email: 'demo@cinex.com', role: 'CONSUMER', demoMode: true })
      navigate('/demo', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E8B84B]/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[380px] bg-[#111113] border-[#222224] text-[#f5f0e8] shadow-2xl relative z-10 p-4">
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold tracking-tight text-[#f5f0e8] mb-1">
            <span className="text-[#E8B84B] mr-1.5">▶</span>CineX
          </div>
          <CardDescription className="text-zinc-500 text-xs">
            Sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Recruiter One-Click Demo Mode Entry */}
          <div>
            <Button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E8B84B]/20 via-[#E8B84B]/35 to-[#E8B84B]/20 hover:from-[#E8B84B] hover:to-[#E8B84B] border border-[#E8B84B]/60 text-[#E8B84B] hover:text-[#0D0D0F] font-bold h-11 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">🎬</span>
              <span>Explore as Recruiter (Demo Mode)</span>
            </Button>
          </div>

          <div className="flex items-center gap-3 my-2">
            <Separator className="flex-1 bg-[#222224]" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">
              or sign in
            </span>
            <Separator className="flex-1 bg-[#222224]" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-500">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-zinc-500">
                  Password
                </label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true)
                    setForgotError('')
                    setForgotSuccess('')
                    setForgotEmail(form.email)
                  }}
                  className="text-[11px] text-[#E8B84B] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-2">
            New here?{' '}
            <Link to="/register" className="text-[#E8B84B] hover:underline font-medium">
              Create an account
            </Link>
          </p>

          <div className="flex items-center gap-3 my-3">
            <Separator className="flex-1 bg-[#222224]" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              or continue with
            </span>
            <Separator className="flex-1 bg-[#222224]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:9090'
                window.location.href = `${baseUrl}/oauth2/authorization/google`
              }}
              className="bg-[#0D0D0F] border-[#2a2a2a] hover:bg-[#1a1a1d] text-zinc-300 hover:text-white text-xs h-9 font-medium gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:9090'
                window.location.href = `${baseUrl}/oauth2/authorization/github`
              }}
              className="bg-[#0D0D0F] border-[#2a2a2a] hover:bg-[#1a1a1d] text-zinc-300 hover:text-white text-xs h-9 font-medium gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <Separator className="flex-1 bg-[#222224]" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">
              other logins
            </span>
            <Separator className="flex-1 bg-[#222224]" />
          </div>

          <div className="flex justify-center gap-6 pt-1">
            <Link to="/vendor/login" className="text-xs text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              Vendor login →
            </Link>
            <Link to="/admin/login" className="text-xs text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              Admin login →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#222224] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#222224] pb-3">
              <h3 className="text-base font-bold text-[#f5f0e8] flex items-center gap-2">
                <span className="text-[#E8B84B]">🔑</span> Forgot Password
              </h3>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your registered email address. We will verify your account and send a unique password reset link (valid for 15 minutes).
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">Registered Email</label>
                <Input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] h-10 px-3 text-xs"
                />
              </div>

              {forgotError && (
                <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div role="status" className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  {forgotSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotModalOpen(false)}
                  className="border-[#2a2a2a] text-zinc-400 hover:bg-[#1C1C1F] text-xs h-9"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading || !!forgotSuccess}
                  className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold text-xs h-9 px-4 cursor-pointer"
                >
                  {forgotLoading ? 'Sending Link…' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
