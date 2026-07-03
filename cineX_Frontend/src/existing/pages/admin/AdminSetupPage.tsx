import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminSetupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [totpSecret, setTotpSecret] = useState('')

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
      // POST /admin/setup
      // Returns a string containing the TOTP secret key
      const { data } = await api.post<string>('/admin/setup', {
        email: form.email,
        password: form.password,
      })

      // The response payload should contain the secret
      // (e.g. "Admin setup complete. Secret: JBSWY3DPEHPK3PXP")
      // Let's parse out the Base32 code or show the raw response
      const match = data.match(/Secret:\s*([A-Z2-7]+)/i)
      const secret = match ? match[1] : data
      setTotpSecret(secret)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Setup failed. The admin account might already exist.'
      setError(typeof msg === 'string' ? msg : 'Bootstrap configuration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E8B84B]/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[420px] bg-[#111113] border-[#222224] text-[#f5f0e8] shadow-2xl relative z-10 p-4">
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold tracking-tight text-[#f5f0e8] mb-1.5">
            <span className="text-[#E8B84B] mr-1.5">▶</span>CineX
          </div>
          <span className="inline-block self-center text-[10px] uppercase tracking-wider font-semibold text-[#E8B84B] bg-[#E8B84B]/8 border border-[#E8B84B]/20 rounded px-2 py-0.5 mb-2">
            One-Time Bootstrap
          </span>
          <CardTitle className="text-lg font-semibold text-[#f5f0e8] m-0">
            Initialize Admin Account
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-1">
            {totpSecret
              ? 'MFA Configuration Secret Key Generated'
              : 'Setup the master system administrator credentials.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {totpSecret ? (
            <div className="space-y-5">
              <div className="bg-[#0D0D0F] border border-[#2a2a2a] rounded-lg p-4 text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                  Base32 Secret Code
                </div>
                <div className="font-mono text-base font-bold text-[#E8B84B] tracking-wider break-all select-all">
                  {totpSecret}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-400 bg-[#0D0D0F]/40 border border-[#222224] rounded-lg p-4">
                <div className="font-semibold text-zinc-300">How to register in Authenticator:</div>
                <p>1. Open Google Authenticator or any MFA app.</p>
                <p>2. Tap the "+" button and choose "Enter a setup key".</p>
                <p>3. Set the Account name to <code className="text-[#E8B84B]">CineX Admin</code>.</p>
                <p>4. Paste the secret key shown above and select "Time-based".</p>
              </div>

              <Button
                type="button"
                onClick={() => navigate('/admin/login', { replace: true })}
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
              >
                Continue to Admin Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-500">
                  Setup Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="admin@cinex.com"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-500 flex justify-between items-center">
                  <span>Setup Admin Password</span>
                  {form.password.length > 0 && form.password.length < 8 && (
                    <span className="text-[10px] text-red-400 font-normal">min 8 characters</span>
                  )}
                </label>
                <Input
                  id="password"
                  type="password"
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
                disabled={loading || form.password.length < 8}
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
              >
                {loading ? 'Initializing Master Admin…' : 'Initialize Master Admin'}
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-[#222224]">
            <Link to="/admin/login" className="text-xs text-zinc-500 hover:text-[#E8B84B] transition-colors font-medium">
              ← Cancel and return
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
