import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import DemoBanner from '../../components/DemoBanner'
import {
  ShieldCheck,
  Building2,
  Ticket,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react'

export default function DemoHubPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans flex flex-col relative overflow-x-hidden">
      <DemoBanner />

      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E8B84B]/5 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8B84B]/10 border border-[#E8B84B]/30 text-[#E8B84B] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Recruiter Tour Mode
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Welcome to <span className="text-[#E8B84B]">CineX</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            You are logged in with Demo ID <code className="text-[#E8B84B] bg-[#161619] px-2 py-0.5 rounded border border-[#2a2a2e]">{user?.email || 'demo@cinex.com'}</code>. Explore all system role dashboards or complete a live ticket booking.
          </p>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Admin Dashboard */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#E8B84B]/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02] group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8B84B]/10 border border-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B] group-hover:bg-[#E8B84B] group-hover:text-black transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock size={10} /> Read-only
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed mt-2">
                  Explore platform metrics, vendor approval & banning workflows, movie catalog management, and async audit security logs.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Real-time System Statistics
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Vendor Management & Audit Log
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="mt-6 w-full bg-zinc-800 hover:bg-[#E8B84B] text-zinc-200 hover:text-black font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg cursor-pointer"
            >
              Explore Admin Panel <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2: Vendor Dashboard */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#E8B84B]/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02] group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Vendor Dashboard</h2>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock size={10} /> Read-only
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed mt-2">
                  Inspect theatre multiplex listings across 38 cities, screen configurations, show schedules, and vendor revenue reports.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> INOX Multiplex Telemetry
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Show Timings & Revenue Stats
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="mt-6 w-full bg-zinc-800 hover:bg-blue-500 text-zinc-200 hover:text-black font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg cursor-pointer"
            >
              Explore Vendor Panel <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 3: Live Customer Booking Flow */}
          <div className="bg-[#121214] border border-[#E8B84B]/30 hover:border-[#E8B84B] rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02] group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#E8B84B] text-black font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-lg">
              Fully Active
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8B84B]/20 border border-[#E8B84B]/40 flex items-center justify-center text-[#E8B84B] group-hover:bg-[#E8B84B] group-hover:text-black transition-colors">
                <Ticket size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Book a Ticket <span className="text-[#E8B84B] text-xs">✨</span>
                </h2>
                <p className="text-zinc-400 text-xs leading-relaxed mt-2">
                  Experience the end-to-end customer flow: browse shows by city, select interactive seats, simulate payment, and view engaged seats!
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Interactive Seat Matrix
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Mock Razorpay Gateway Simulation
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/consumer/browse')}
              className="mt-6 w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E8B84B]/10 cursor-pointer"
            >
              Start Booking Flow <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* Footnote */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 text-center text-xs text-zinc-500">
          💡 <strong className="text-zinc-300">Recruiter Note:</strong> After completing a booking, return to the seat layout on any subsequent visit to see your reserved seat marked as engaged!
        </div>
      </main>
    </div>
  )
}
