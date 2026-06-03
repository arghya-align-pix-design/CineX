import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login }        = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const from             = location.state?.from?.pathname

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const handleSubmit = async (e:Event) => {
    e.preventDefault()
    if (!email || !password) { setError('Both fields are required.'); return }
    setError('')
    setLoading(true)
    try {
      const role = await login(email, password)

      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else if (role === 'VENDOR') {
        navigate('/vendor/dashboard', { replace: true })
      } else if (role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/shows', { replace: true })
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || 'Invalid email or password.'
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4">

      {/* Subtle ambient glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[#E8B84B]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-[#E8B84B] rounded-xl flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D0D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            </svg>
          </div>
          <h1 className="text-[#F2F0EC] text-xl font-medium tracking-tight">CineX</h1>
          <p className="text-[#555] text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#111113] border border-white/[0.06] rounded-2xl p-7 flex flex-col gap-4"
        >

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[11px] text-[#666] tracking-wide uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F2F0EC] placeholder-[#3A3A3C] outline-none focus:border-[#E8B84B]/40 focus:ring-1 focus:ring-[#E8B84B]/20 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[11px] text-[#666] tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#F2F0EC] placeholder-[#3A3A3C] outline-none focus:border-[#E8B84B]/40 focus:ring-1 focus:ring-[#E8B84B]/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="text-[#E8584B] text-xs bg-[#E8584B]/10 border border-[#E8584B]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8B84B] hover:bg-[#D4A43A] active:scale-[0.98] text-[#0D0D0F] font-medium text-sm py-2.5 rounded-lg transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>

          <p className="text-[#444] text-xs text-center mt-1">
            No account?{' '}
            <Link to="/register" className="text-[#E8B84B] hover:text-[#F0C96A] transition-colors">
              Create one
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
