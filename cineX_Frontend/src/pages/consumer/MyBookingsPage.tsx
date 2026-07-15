import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import { fetchMyBookings, type BookingResponse } from '../../services/consumerApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MyBookingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true)
        const data = await fetchMyBookings()
        // Sort by creation date descending (latest bookings first)
        const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setBookings(sorted)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch booking history.')
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  // Filter into Confirmed (Active) vs Cancelled/Pending
  const { activeBookings, pastBookings } = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING')
    const past = bookings.filter((b) => b.status === 'CANCELLED')
    return { activeBookings: active, pastBookings: past }
  }, [bookings])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderBookingCard = (b: BookingResponse) => {
    let statusBadge = ""
    if (b.status === 'CONFIRMED') {
      statusBadge = "bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]"
    } else if (b.status === 'PENDING') {
      statusBadge = "bg-amber-500/10 border-amber-500/20 text-amber-500"
    } else {
      statusBadge = "bg-zinc-800 border-transparent text-zinc-500"
    }

    return (
      <Card key={b.id} className="bg-[#111113] border-[#222224] text-[#f5f0e8] overflow-hidden shadow-md">
        <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[9px] font-bold uppercase tracking-wider border rounded-md px-2 py-0.5 ${statusBadge}`}>
                {b.status}
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">Ref: {b.bookingRef}</span>
              {b.status === 'PENDING' && (
                <Link to={`/bookings/${b.bookingRef}`}>
                  <span className="text-[9px] font-bold text-[#E8B84B] hover:underline cursor-pointer">
                    Complete checkout →
                  </span>
                </Link>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base md:text-lg text-[#f5f0e8]">{b.movieTitle}</h3>
              <p className="text-xs text-zinc-400">📍 {b.theatreName}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Date & Time</span>
                <span className="text-zinc-300 font-medium">{b.showDate} • {b.showTime.substring(0, 5)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Seats Selected</span>
                <span className="text-[#E8B84B] font-extrabold">{b.seatCodes.join(', ')}</span>
              </div>
              <div className="space-y-0.5 sm:col-span-1">
                <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Transaction Date</span>
                <span className="text-zinc-400 font-mono">{new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#222224] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-8 flex flex-col md:items-end justify-center min-w-[120px] shrink-0">
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Amount Paid</span>
            <span className="text-xl font-extrabold text-[#E8B84B] mt-0.5">₹{b.totalPrice}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#f5f0e8] font-sans">
      {/* Navbar */}
      <nav className="border-b border-[#222224] bg-[#111113]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/consumer/browse" className="text-xl font-bold tracking-tight text-[#f5f0e8] flex items-center">
              <span className="text-[#E8B84B] mr-2">▶</span>CineX
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/bookings" className="text-xs text-[#E8B84B] font-medium">
              My Bookings
            </Link>
            <div className="h-4 w-px bg-[#222224]" />
            <span className="text-xs text-zinc-500 hidden sm:inline-block">
              {user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-xs text-zinc-400 hover:text-[#E8B84B] hover:bg-transparent cursor-pointer"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#f5f0e8] flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-[#E8B84B]" />
            Booking History
          </h1>
          <Link to="/consumer/browse">
            <Button size="sm" variant="outline" className="text-xs border-[#2a2a2a] text-zinc-300 hover:text-[#E8B84B] hover:bg-[#1C1C1F]">
              ← Book More Tickets
            </Button>
          </Link>
        </div>

        {error && <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-4">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <svg className="animate-spin w-8 h-8 text-[#E8B84B]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs text-zinc-500">Retrieving tickets history...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#222224] rounded-2xl bg-[#111113]/30">
            <div className="text-zinc-500 text-3xl mb-3">🎫</div>
            <h3 className="text-sm font-semibold text-zinc-300">No bookings yet</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">Explore our movie catalog and schedule your first movie show with CineX!</p>
            <Link to="/consumer/browse">
              <Button size="sm" className="mt-4 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold">
                Browse Movies
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Active & Pending Tickets</h2>
                <div className="space-y-4">
                  {activeBookings.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Past/Cancelled Bookings */}
            {pastBookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Cancelled Bookings</h2>
                <div className="space-y-4">
                  {pastBookings.map(renderBookingCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
