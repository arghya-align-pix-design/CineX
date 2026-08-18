import { useNavigate } from 'react-router-dom'
import { useAuth } from '../existing/context/AuthContext'
import { ShieldAlert, LayoutDashboard, LogOut } from 'lucide-react'

export default function DemoBanner() {
  const { demoMode, logout } = useAuth()
  const navigate = useNavigate()

  if (!demoMode) return null

  const handleExit = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-[#18150D] via-[#2A200B] to-[#18150D] border-b border-[#E8B84B]/40 px-4 py-2 text-xs flex items-center justify-between shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 text-[#E8B84B] font-medium">
        <ShieldAlert size={16} className="text-[#E8B84B] animate-pulse" />
        <span>
          <strong className="font-bold uppercase tracking-wide">Recruiter Demo Mode:</strong> Dashboard actions are read-only. Live customer ticket booking & payment simulation are active.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/demo')}
          className="flex items-center gap-1.5 bg-[#E8B84B]/10 border border-[#E8B84B]/30 hover:bg-[#E8B84B]/20 text-[#E8B84B] px-2.5 py-1 rounded font-semibold transition-all cursor-pointer text-[11px]"
        >
          <LayoutDashboard size={13} />
          Demo Hub
        </button>

        <button
          onClick={handleExit}
          className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded font-semibold transition-all cursor-pointer text-[11px]"
        >
          <LogOut size={13} />
          Exit Demo
        </button>
      </div>
    </div>
  )
}
