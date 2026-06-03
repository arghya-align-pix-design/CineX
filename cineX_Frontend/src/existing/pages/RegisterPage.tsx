import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    if (!form.name.trim())            return 'Name is required.'
    if (!form.email.trim())           return 'Email is required.'
    if (form.password.length < 8)     return 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4 py-10">

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
          <p className="text-[#555] text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#111113] border border-white/[0.06] rounded-2xl p-7 flex flex-col gap-4"
        >

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[11px] text-[#666] tracking-wide uppercase">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              placeholder="Arjun Reddy"
              className="w-full bg-[#1A1A1C] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#F2F0EC] placeholder-[#3A3A3C] outline-none focus:border-[#E8B84B]/40 focus:ring-1 focus:ring-[#E8B84B]/20 transition-colors"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[11px] text-[#666] tracking-wide uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
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
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Minimum 8 characters"
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
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="flex gap-1 mt-1">
                {[1,2,3].map((n) => (
                  <div
                    key={n}
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      form.password.length >= n * 4
                        ? n === 1 ? 'bg-[#E8584B]'
                          : n === 2 ? 'bg-[#E8B84B]'
                          : 'bg-[#4CAF88]'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-[11px] text-[#666] tracking-wide uppercase">
              Confirm password
            </label>
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat your password"
              className={`w-full bg-[#1A1A1C] border rounded-lg px-3 py-2.5 text-sm text-[#F2F0EC] placeholder-[#3A3A3C] outline-none focus:ring-1 transition-colors ${
                form.confirm && form.confirm !== form.password
                  ? 'border-[#E8584B]/40 focus:border-[#E8584B]/60 focus:ring-[#E8584B]/20'
                  : form.confirm && form.confirm === form.password
                  ? 'border-[#4CAF88]/40 focus:border-[#4CAF88]/60 focus:ring-[#4CAF88]/20'
                  : 'border-white/[0.08] focus:border-[#E8B84B]/40 focus:ring-[#E8B84B]/20'
              }`}
            />
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
                Creating account…
              </span>
            ) : 'Create account'}
          </button>

          <p className="text-[#444] text-xs text-center mt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E8B84B] hover:text-[#F0C96A] transition-colors">
              Sign in
            </Link>
          </p>

        </form>

        <p className="text-[#333] text-[11px] text-center mt-5 leading-relaxed">
          By registering you agree to CineX terms of service.<br/>
          Vendor accounts are by invitation only.
        </p>

      </div>
    </div>
  )
}
