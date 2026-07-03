import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LoginResponse {
  token: string
  role: 'VENDOR'
  firstLogin: boolean
}

export default function VendorLoginPage() {
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

      login(data.token, { email: form.email, role: 'VENDOR' })

      if (data.firstLogin) {
        navigate('/vendor/setup', { replace: true })
      } else {
        navigate('/vendor/dashboard', { replace: true })
      }
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
            Vendor Portal
          </span>
          <CardTitle className="text-lg font-semibold text-[#f5f0e8] m-0">
            Sign in as Vendor
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-1">
            Manage your theatres and schedules
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
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
                placeholder="vendor@example.com"
                className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-500">
                Temporary or permanent password
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
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
            </Button>
          </form>

          <div className="flex justify-center gap-6 pt-2 border-t border-[#222224]">
            <Link to="/login" className="text-xs text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              ← Standard login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
