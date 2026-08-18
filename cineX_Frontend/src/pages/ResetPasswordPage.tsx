import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../existing/api/axios'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword: password,
      })
      setSuccess(data.message || 'Password updated successfully!')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'This reset link has expired or is invalid.'
      setError(typeof msg === 'string' ? msg : 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E8B84B]/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[400px] bg-[#111113] border-[#222224] text-[#f5f0e8] shadow-2xl relative z-10 p-4">
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold tracking-tight text-[#f5f0e8] mb-1">
            <span className="text-[#E8B84B] mr-1.5">▶</span>CineX
          </div>
          <CardDescription className="text-zinc-500 text-xs">
            Set a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {!token ? (
            <div className="space-y-4 text-center">
              <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                Invalid or missing reset token in URL. Please request a new password reset link.
              </div>
              <Link to="/login">
                <Button className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold text-xs h-10">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div role="status" className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 leading-relaxed">
                🎉 {success}<br/>
                <span className="text-[11px] text-zinc-400 font-normal">Redirecting to login page in 3 seconds...</span>
              </div>
              <Link to="/login">
                <Button className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold text-xs h-10">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">New Password</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] h-10 px-3 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">Confirm New Password</label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] h-10 px-3 text-xs"
                />
              </div>

              {error && (
                <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold h-10 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {loading ? 'Updating Password…' : 'Update Password'}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-zinc-500 mt-2">
            Remembered your password?{' '}
            <Link to="/login" className="text-[#E8B84B] hover:underline font-medium">
              Back to Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
