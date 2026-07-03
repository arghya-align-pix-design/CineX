import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LoginResponse {
  token: string
  role: 'ADMIN'
  firstLogin: boolean
}

export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Steps: 'credentials' -> 'totp'
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [form, setForm] = useState({ email: '', password: '' })
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const totpRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Both fields are required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      // POST /admin/login-step1 to verify basic credentials
      const { data } = await api.post<LoginResponse>('/admin/login-step1', {
        email: form.email,
        password: form.password,
      })

      if (data.role !== 'ADMIN') {
        setError('Unauthorized role. This portal is for Administrators only.')
        setLoading(false)
        return
      }

      // Credentials are good, transition to TOTP challenge step
      setStep('totp')
      setTimeout(() => totpRef.current?.focus(), 100)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Invalid admin credentials.'
      setError(typeof msg === 'string' ? msg : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      // POST /admin/verify-totp to complete MFA handshake
      const { data: rawJwt } = await api.post<string>('/admin/verify-totp', {
        email: form.email,
        code: totpCode,
      })

      login(rawJwt, { email: form.email, role: 'ADMIN' })
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Invalid or expired TOTP code.'
      setError(typeof msg === 'string' ? msg : 'MFA verification failed.')
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
          <div className="text-2xl font-bold tracking-tight text-[#f5f0e8] mb-1.5">
            <span className="text-[#E8B84B] mr-1.5">▶</span>CineX
          </div>
          <span className="inline-block self-center text-[10px] uppercase tracking-wider font-semibold text-[#E8B84B] bg-[#E8B84B]/8 border border-[#E8B84B]/20 rounded px-2 py-0.5 mb-2">
            Admin Portal
          </span>
          <CardTitle className="text-lg font-semibold text-[#f5f0e8] m-0">
            {step === 'credentials' ? 'Admin Authentication' : 'Verification Needed'}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-1">
            {step === 'credentials'
              ? 'Enter your administration credentials'
              : 'Enter the 6-digit verification code from your authenticator app'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-500">
                  Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="admin@cinex.com"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-500">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
                />
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
                {loading ? 'Verifying…' : 'Authenticate'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="totp-code" className="text-xs font-medium text-zinc-500">
                  6-Digit Code
                </label>
                <Input
                  id="totp-code"
                  ref={totpRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3 text-center tracking-[0.25em] font-mono text-base"
                />
              </div>

              {error && (
                <div role="alert" className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('credentials')
                    setError('')
                    setTotpCode('')
                  }}
                  className="flex-1 bg-transparent border-[#2a2a2a] text-[#f5f0e8] hover:bg-zinc-900 hover:text-white h-10 rounded-lg cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="flex-1 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Checking…' : 'Verify'}
                </Button>
              </div>
            </form>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#222224] text-xs">
            <Link to="/login" className="text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              ← Standard login
            </Link>
            <Link to="/admin/setup" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              Bootstrap Setup
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
