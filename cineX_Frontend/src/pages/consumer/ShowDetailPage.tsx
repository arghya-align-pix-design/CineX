import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import { fetchShowSeats, initiateBooking, type ShowSeatsResponse, type SeatStatus } from '../../services/consumerApi'
import { Button } from '@/components/ui/button'

export default function ShowDetailPage() {
  const { showId } = useParams<{ showId: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showSeats, setShowSeats] = useState<ShowSeatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  useEffect(() => {
    if (!showId) return
    async function loadSeats() {
      try {
        setLoading(true)
        const data = await fetchShowSeats(Number(showId))
        setShowSeats(data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch seat layout. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadSeats()
  }, [showId])

  // Group seats by row label and sort them properly
  const parsedRows = useMemo(() => {
    if (!showSeats) return []

    const rowsMap: { [rowLabel: string]: SeatStatus[] } = {}
    showSeats.seats.forEach((seat) => {
      const rowMatch = seat.seatCode.match(/^([A-Z]+)/)
      const rowLabel = rowMatch ? rowMatch[1] : 'A'
      if (!rowsMap[rowLabel]) {
        rowsMap[rowLabel] = []
      }
      rowsMap[rowLabel].push(seat)
    })

    // Sort row labels (e.g., A is near screen at bottom, Z is back at top)
    const sortedRowLabels = Object.keys(rowsMap).sort((a, b) => b.localeCompare(a))

    return sortedRowLabels.map((rowLabel) => {
      // Sort seats within each row by column index
      const sortedSeats = [...rowsMap[rowLabel]].sort((a, b) => {
        const aCol = parseInt(a.seatCode.replace(/^[A-Z]+/, ''), 10) || 0
        const bCol = parseInt(b.seatCode.replace(/^[A-Z]+/, ''), 10) || 0
        return aCol - bCol
      })
      return { rowLabel, seats: sortedSeats }
    })
  }, [showSeats])

  // Handle seat clicks
  const handleSeatClick = (seatCode: string, status: SeatStatus['status']) => {
    if (status === 'BOOKED' || status === 'IN_CHECKOUT') return

    setSelectedSeats((prev) => {
      if (prev.includes(seatCode)) {
        return prev.filter((code) => code !== seatCode)
      } else {
        if (prev.length >= 8) {
          setError('You can select a maximum of 8 seats.')
          return prev
        }
        setError('')
        return [...prev, seatCode]
      }
    })
  }

  // Calculate pricing
  const totalCost = useMemo(() => {
    if (!showSeats) return 0
    return selectedSeats.length * showSeats.basePrice
  }, [selectedSeats, showSeats])

  // Call /bookings/initiate and navigate to booking ref confirmation
  const handleInitiateBooking = async () => {
    if (selectedSeats.length === 0 || !showId) return
    setError('')
    setBookingLoading(true)

    try {
      const booking = await initiateBooking(Number(showId), selectedSeats)
      navigate(`/bookings/${booking.bookingRef}`)
    } catch (err: unknown) {
      console.error(err)
      const axiosErr = err as { response?: { data?: { message?: string } | string } }
      const msg =
        (typeof axiosErr.response?.data === 'object'
          ? axiosErr.response?.data?.message
          : axiosErr.response?.data) ?? 'Failed to block seats. One or more selected seats may have just been locked by another user.'
      setError(typeof msg === 'string' ? msg : 'Failed to block seats.')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#f5f0e8] font-sans flex flex-col justify-between">
      <div>
        {/* Navbar */}
        <nav className="border-b border-[#222224] bg-[#111113]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/consumer/browse" className="text-xl font-bold tracking-tight text-[#f5f0e8] flex items-center">
                <span className="text-[#E8B84B] mr-2">▶</span>CineX
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/bookings" className="text-xs text-zinc-400 hover:text-[#E8B84B] transition-colors font-medium">
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <svg className="animate-spin w-8 h-8 text-[#E8B84B]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs text-zinc-500">Loading seat layout...</p>
          </div>
        ) : (
          showSeats && (
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
              {/* Show info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#111113] border border-[#222224] rounded-xl p-4">
                <div>
                  <h1 className="text-xl font-extrabold text-[#f5f0e8]">{showSeats.movieTitle}</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    📅 {showSeats.showDate} • 🕒 {showSeats.showTime.substring(0, 5)} • Ticket Rate: ₹{showSeats.basePrice}
                  </p>
                </div>
                <div className="text-xs text-zinc-400">
                  Hall Section: <span className="text-[#E8B84B] font-bold">{showSeats.sectionName} ({showSeats.seatType})</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl">
                  {error}
                </div>
              )}

              {/* Seating Map */}
              <div className="bg-[#111113] border border-[#222224] rounded-2xl p-6 md:p-10 flex flex-col items-center overflow-x-auto shadow-2xl relative">
                
                {/* Seating Grid */}
                <div className="space-y-4 mb-16 min-w-max">
                  {parsedRows.map((row) => (
                    <div key={row.rowLabel} className="flex items-center gap-3">
                      {/* Row Label */}
                      <span className="w-6 text-right text-xs font-mono text-zinc-500 font-bold select-none">
                        {row.rowLabel}
                      </span>
                      
                      {/* Seats row */}
                      <div className="flex gap-2">
                        {row.seats.map((seat) => {
                          const colNum = parseInt(seat.seatCode.replace(/^[A-Z]+/, ''), 10)
                          const isSelected = selectedSeats.includes(seat.seatCode)
                          const isBooked = seat.status === 'BOOKED'
                          const isLocked = seat.status === 'IN_CHECKOUT'

                          let seatStyle = "bg-[#1C1C1F] border-[#2a2a2a] text-zinc-400 hover:border-[#E8B84B] hover:text-[#f5f0e8] hover:bg-[#1C1C1F]/80"
                          if (isSelected) {
                            seatStyle = "bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]"
                          } else if (isBooked) {
                            seatStyle = "bg-zinc-800 border-transparent text-zinc-600 opacity-20 cursor-not-allowed"
                          } else if (isLocked) {
                            seatStyle = "bg-red-500/20 border-red-500/30 text-red-400/60 cursor-not-allowed"
                          }

                          return (
                            <button
                              key={seat.seatCode}
                              disabled={isBooked || isLocked}
                              onClick={() => handleSeatClick(seat.seatCode, seat.status)}
                              className={`w-8 h-8 rounded-lg text-[9px] font-bold border transition-all duration-100 flex items-center justify-center cursor-pointer select-none ${seatStyle}`}
                              title={`Seat ${seat.seatCode} (${seat.status})`}
                            >
                              {colNum}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Screen representation */}
                <div className="w-full max-w-md flex flex-col items-center gap-1.5 border-t border-[#222224] pt-8 select-none">
                  <span className="text-[10px] tracking-[6px] text-zinc-600 font-bold">SCREEN THIS WAY</span>
                  <div className="h-1.5 w-64 rounded-full bg-[#E8B84B] shadow-lg shadow-[#E8B84B]/20" />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#1C1C1F] border border-[#2a2a2a]" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E8B84B]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-zinc-800 opacity-20" />
                    <span>Taken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                    <span>Locked/Hold</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Floating Price Booking Bar */}
      {selectedSeats.length > 0 && showSeats && (
        <div className="bg-[#111113] border-t border-[#222224] py-4 px-6 md:py-6 shadow-2xl sticky bottom-0 z-50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Selected seats</div>
              <div className="text-sm font-bold text-[#E8B84B]">
                {selectedSeats.join(', ')} ({selectedSeats.length} ticket{selectedSeats.length > 1 ? 's' : ''})
              </div>
              <div className="text-lg font-extrabold text-[#f5f0e8] mt-1">
                Total Price: ₹{totalCost}
              </div>
            </div>
            
            <Button
              disabled={bookingLoading}
              onClick={handleInitiateBooking}
              className="w-full sm:w-auto bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-extrabold h-11 px-8 rounded-lg transition-all cursor-pointer shadow-lg shadow-[#E8B84B]/10"
            >
              {bookingLoading ? 'Reserving Seats…' : 'Proceed to Checkout'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
