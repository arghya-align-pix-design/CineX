import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function VendorSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const isPasswordValid = password.length >= 8
  const matches = password === confirmPassword
  const isDisabled = loading || !isPasswordValid || !matches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDisabled) return
    setError('')
    setLoading(true)

    try {
      // POST /vendor/change-password
      // Bearer token will be automatically injected by Axios request interceptor
      await api.post('/vendor/change-password', {
        newPassword: password,
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/vendor/dashboard', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Failed to update password.'
      setError(typeof msg === 'string' ? msg : 'Failed to update password.')
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
            First-Time Setup
          </span>
          <CardTitle className="text-lg font-semibold text-[#f5f0e8] m-0">
            Secure Your Account
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs mt-1">
            Change your temporary password to a permanent one.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {success ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-[#4ade80] text-sm font-semibold">✔ Password Changed Successfully</div>
              <p className="text-zinc-500 text-xs">Redirecting you to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">Account Email</label>
                <div className="text-sm font-medium text-zinc-300 bg-[#0D0D0F] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  {user?.email ?? 'vendor@cinex.com'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pass" className="text-xs font-medium text-zinc-500 flex justify-between items-center">
                  <span>New Password</span>
                  {password.length > 0 && !isPasswordValid && (
                    <span className="text-[10px] text-red-400 font-normal">min 8 characters</span>
                  )}
                </label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/20 h-10 px-3"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-xs font-medium text-zinc-500 flex justify-between items-center">
                  <span>Confirm Password</span>
                  {confirmPassword.length > 0 && !matches && (
                    <span className="text-[10px] text-red-400 font-normal">Passwords do not match</span>
                  )}
                </label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
                disabled={isDisabled}
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-semibold h-10 rounded-lg transition-colors cursor-pointer"
              >
                {loading ? 'Updating password…' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
