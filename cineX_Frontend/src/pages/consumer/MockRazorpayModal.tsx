import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Landmark, Wallet, QrCode, ShieldCheck, X, AlertTriangle } from 'lucide-react'

interface MockRazorpayModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number // in paise
  bookingRef: string
  onSuccess: (paymentId: string, orderId: string, signature: string) => void
  onFailure: (errorMessage: string) => void
}

type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET'

export default function MockRazorpayModal({
  isOpen,
  onClose,
  orderId,
  amount,
  bookingRef,
  onSuccess,
  onFailure,
}: MockRazorpayModalProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('UPI')
  const [processing, setProcessing] = useState(false)

  // Input states
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState('')

  if (!isOpen) return null

  const displayAmount = (amount / 100).toFixed(2)

  // Generate cryptographic signature locally using Web Crypto API
  const generateSignature = async (paymentId: string): Promise<string> => {
    const secret = 'mock_secret_key_98765'
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(`${orderId}|${paymentId}`)

    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await window.crypto.subtle.sign('HMAC', key, messageData)
    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleSimulateSuccess = async () => {
    setProcessing(true)
    setTimeout(async () => {
      try {
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 14)
        const signature = await generateSignature(mockPaymentId)
        onSuccess(mockPaymentId, orderId, signature)
      } catch (err) {
        console.error('Signature generation failed', err)
        onFailure('Cryptographic signature verification setup failed.')
      } finally {
        setProcessing(false)
      }
    }, 1500)
  }

  const handleSimulateFailure = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onFailure('Payment was declined by the bank or cancelled by the user.')
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-4">
      <Card className="w-full max-w-[620px] bg-[#121216] border-[#25252b] text-[#f5f0e8] overflow-hidden shadow-2xl relative animate-scale-up">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-[#E8B84B]" />

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#25252b] bg-[#17171d]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-extrabold text-indigo-400">
              CX
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                CineX Checkout <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase">Mock SandBox</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">Ref: {bookingRef}</p>
            </div>
          </div>
          <button 
            disabled={processing}
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Order details */}
        <div className="px-6 py-4 bg-[#1a1a22] border-b border-[#25252b] flex justify-between items-center">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Order ID</span>
            <span className="text-xs text-zinc-300 font-mono">{orderId}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Total Amount</span>
            <span className="text-lg font-black text-[#E8B84B] font-mono">₹{displayAmount}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <CardContent className="p-0 flex flex-col md:flex-row h-[320px]">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-[180px] bg-[#141419] border-r md:border-b-0 border-b border-[#25252b] flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {[
              { id: 'UPI', label: 'UPI / QR', icon: QrCode },
              { id: 'CARD', label: 'Cards', icon: CreditCard },
              { id: 'NETBANKING', label: 'Net Banking', icon: Landmark },
              { id: 'WALLET', label: 'Wallets', icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon
              const isSelected = activeMethod === tab.id
              return (
                <button
                  key={tab.id}
                  disabled={processing}
                  onClick={() => setActiveMethod(tab.id as PaymentMethod)}
                  className={`flex items-center gap-2.5 px-4 py-3 md:py-3.5 text-left text-xs font-semibold border-b md:border-b-0 md:border-l-2 transition-all cursor-pointer w-full whitespace-nowrap ${
                    isSelected
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a22]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Form Content */}
          <div className="flex-1 p-6 bg-[#111115] overflow-y-auto">
            {processing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-300 font-bold animate-pulse">Contacting Secure Bank...</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Please do not refresh or hit back</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                
                {/* Method fields */}
                <div>
                  {activeMethod === 'UPI' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Pay via UPI ID</label>
                        <input
                          type="text"
                          placeholder="username@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-[#18181d] border border-[#25252b] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-zinc-400 leading-normal flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>Supports all popular UPI apps: GPay, PhonePe, Paytm, AmazonPay, and any custom virtual payment address.</span>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'CARD' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-[#18181d] border border-[#25252b] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="12/29"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg bg-[#18181d] border border-[#25252b] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg bg-[#18181d] border border-[#25252b] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'NETBANKING' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Select Popular Banks</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['SBI', 'HDFC', 'ICICI', 'Axis'].map((bank) => (
                            <button
                              key={bank}
                              onClick={() => setSelectedBank(bank)}
                              className={`h-9 border text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                                selectedBank === bank
                                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                  : 'bg-[#18181d] border-[#25252b] text-zinc-300 hover:border-zinc-500'
                              }`}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'WALLET' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Popular Wallets</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Paytm Wallet', 'Mobikwik', 'Freecharge', 'PhonePe Wallet'].map((w) => (
                            <button
                              key={w}
                              onClick={() => setSelectedBank(w)}
                              className={`h-9 border text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                                selectedBank === w
                                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                  : 'bg-[#18181d] border-[#25252b] text-zinc-300 hover:border-zinc-500'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Action Bar */}
                <div className="space-y-2 mt-4">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Simulate Payment Result
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleSimulateSuccess}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 cursor-pointer text-xs transition-colors rounded-lg shadow-lg shadow-emerald-600/10"
                    >
                      Simulate Success
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleSimulateFailure}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-10 cursor-pointer text-xs transition-colors rounded-lg shadow-lg shadow-rose-600/10"
                    >
                      Simulate Failure
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </CardContent>

        {/* Modal Footer */}
        <div className="flex justify-between items-center px-6 py-3.5 bg-[#17171d]/60 border-t border-[#25252b] text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E8B84B]" />
            Secured 256-Bit SSL Mock Gateway
          </div>
          <div>POWERED BY RAZORPAY</div>
        </div>

      </Card>
    </div>
  )
}
