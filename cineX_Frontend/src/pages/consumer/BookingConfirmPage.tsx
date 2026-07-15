import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import { fetchMyBookings, createPaymentOrder, verifyPayment, type BookingResponse } from '../../services/consumerApi'
import MockRazorpayModal from './MockRazorpayModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function BookingConfirmPage() {
  const { bookingRef } = useParams<{ bookingRef: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<BookingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState<any>(null)

  useEffect(() => {
    if (!bookingRef) return
    async function loadBooking() {
      try {
        setLoading(true)
        const bookings = await fetchMyBookings()
        const current = bookings.find((b) => b.bookingRef === bookingRef)
        if (current) {
          setBooking(current)
        } else {
          setError('Booking reference not found in your transactions.')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to retrieve booking summary.')
      } finally {
        setLoading(false)
      }
    }
    loadBooking()
  }, [bookingRef])

  const handleConfirm = async () => {
    if (!bookingRef) return
    setError('')
    setConfirmLoading(true)

    try {
      const order = await createPaymentOrder(bookingRef)
      setPaymentOrder(order)
      setModalOpen(true)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to initialize payment gateway. Please try again.')
      setConfirmLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentId: string, orderId: string, signature: string) => {
    setModalOpen(false)
    try {
      await verifyPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/bookings', { replace: true })
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Payment confirmation failed. Verification failed.')
      setConfirmLoading(false)
    }
  }

  const handlePaymentFailure = (errorMessage: string) => {
    setModalOpen(false)
    setError(errorMessage)
    setConfirmLoading(false)
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
            <p className="text-xs text-zinc-500">Retrieving checkout details...</p>
          </div>
        ) : (
          booking && (
            <div className="max-w-[420px] mx-auto px-4 py-12">
              <Card className="bg-[#111113] border-[#222224] text-[#f5f0e8] shadow-2xl overflow-hidden relative">
                
                {/* Visual Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#E8B84B]/5 blur-[60px] pointer-events-none" />

                <CardHeader className="text-center pb-2">
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase font-bold mb-1">
                    Checkout Checkout
                  </div>
                  {success ? (
                    <CardTitle className="text-lg font-extrabold text-[#4ade80]">
                      ✔ Booking Confirmed!
                    </CardTitle>
                  ) : (
                    <CardTitle className="text-lg font-extrabold text-[#f5f0e8]">
                      Finalize Your Booking
                    </CardTitle>
                  )}
                  <CardDescription className="text-zinc-500 text-xs">
                    Hold duration: 10 minutes maximum
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4 relative z-10">
                  
                  {/* Receipt Box */}
                  <div className="bg-[#0D0D0F] border border-[#222224] rounded-xl p-4 space-y-3.5">
                    
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Movie</div>
                      <div className="text-sm font-extrabold text-[#f5f0e8]">{booking.movieTitle}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 uppercase font-semibold">Theatre</div>
                        <div className="text-xs text-zinc-300 font-medium">{booking.theatreName}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 uppercase font-semibold">Reference ID</div>
                        <div className="text-xs text-zinc-300 font-mono">{booking.bookingRef}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 uppercase font-semibold">Date & Time</div>
                        <div className="text-xs text-zinc-300 font-medium">
                          {booking.showDate} • {booking.showTime.substring(0, 5)}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 uppercase font-semibold">Seats</div>
                        <div className="text-xs text-[#E8B84B] font-extrabold">
                          {booking.seatCodes.join(', ')}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#222224]" />

                    <div className="flex justify-between items-center py-1">
                      <div className="text-xs text-zinc-400 font-bold">Total Bill (inc. GST)</div>
                      <div className="text-base font-extrabold text-[#E8B84B]">₹{booking.totalPrice}</div>
                    </div>

                  </div>

                  {error && (
                    <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  {success ? (
                    <div className="text-center py-2 text-xs text-zinc-400 font-medium">
                      Syncing your tickets. Redirecting to receipt dashboard...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        disabled={confirmLoading}
                        onClick={handleConfirm}
                        className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold h-11 rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#E8B84B]/10"
                      >
                        {confirmLoading ? 'Confirming Ticket…' : 'Pay & Confirm Booking'}
                      </Button>
                      <button
                        disabled={confirmLoading}
                        onClick={() => navigate('/consumer/browse')}
                        className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-semibold py-1.5 cursor-pointer"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
      {paymentOrder && (
        <MockRazorpayModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setConfirmLoading(false)
          }}
          orderId={paymentOrder.orderId}
          amount={paymentOrder.amount}
          bookingRef={bookingRef || ''}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </div>
  )
}
