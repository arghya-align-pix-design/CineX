import React, { useState, useEffect, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

// Defining types for safe routing state data
interface LocationState {
  email?: string;
  autoFilledOtp?: string;
}

interface VerificationPayload {
  email: string;
  otp: string;
}

export default function VerifyOtp(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

  // Casting state securely
  const state = location.state as LocationState | null;
  const registeredEmail = state?.email || '';
  const initialOtp = state?.autoFilledOtp || '';

  const [otp, setOtp] = useState<string>(initialOtp);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  useEffect(() => {
    setShowAlert(true);
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    const payload: VerificationPayload = {
      email: registeredEmail,
      otp: otp
    };

    console.log("Sending payload to backend verification endpoint:", payload);

    try {
      // Replace with actual verification fetch/axios call
      const response = await new Promise<{ success: boolean }>((resolve) => 
        setTimeout(() => resolve({ success: true }), 1500)
      );

      if (response.success) {
        navigate('/login', { state: { verified: true } });
      }
    } catch (error) {
      console.error("OTP Verification failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative antialiased text-zinc-50">
      
      {/* Timed Alert Banner */}
      {showAlert && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-amber-500/30 text-amber-400 px-6 py-3 rounded-md shadow-2xl font-medium text-sm flex items-center space-x-2 transition-all duration-300">
          <KeyRound className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>Security Alert: An access token has been dispatched to your email.</span>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Security Verification</h2>
          <p className="text-sm text-zinc-400 text-center px-4">
            Confirm identity for <span className="text-zinc-200 font-medium">{registeredEmail || 'Admin'}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex justify-between">
              <span>One-Time Password</span>
              <span className="text-amber-500/70 lowercase text-[11px] font-normal">Auto-captured for testing</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2.5 pl-10 pr-4 text-base font-mono tracking-[0.5em] text-center text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-zinc-700"
                placeholder="000000"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium py-2.5 rounded-md text-sm transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
            ) : (
              'Verify Credentials & Activate'
            )}
          </button>
        </form>

        {/* Navigation fallback */}
        <div className="text-center">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center mx-auto space-x-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Registration</span>
          </button>
        </div>
      </div>
    </div>
  );
}