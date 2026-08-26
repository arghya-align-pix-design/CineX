import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const isDisabled = loading || !form.email.trim() || form.password.length < 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDisabled) return
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        email: form.email.trim(),
        password: form.password,
      })
      login({ email: form.email.trim(), role: 'CONSUMER' })
      navigate('/consumer/browse', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Registration failed. Please try again.'
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
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
            Consumer
          </span>
          <CardTitle className="text-lg font-semibold text-[#f5f0e8] m-0">
            Create your account
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-1">
            Book shows, track your tickets.
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
                placeholder="you@example.com"
                className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-500 flex justify-between items-center">
                <span>Password</span>
                {form.password.length > 0 && form.password.length < 8 && (
                  <span className="text-[10px] text-red-400 font-normal">min 8 characters</span>
                )}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 8 characters"
                className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
              />

              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[4, 8, 12].map((threshold, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[3px] rounded transition-all duration-300"
                      style={{
                        background:
                          form.password.length >= threshold
                            ? i === 0
                              ? '#f87171'
                              : i === 1
                              ? '#E8B84B'
                              : '#4ade80'
                            : '#222224',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E8B84B] hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-[10px] text-zinc-600 mt-4 pt-2 border-t border-[#222224]">
            Vendor accounts are by invitation only.{' '}
            <Link to="/vendor/login" className="text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              Vendor login →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
