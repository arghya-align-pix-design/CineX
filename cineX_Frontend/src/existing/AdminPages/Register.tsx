import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Lock, Mail, Loader2 } from 'lucide-react';

interface MockRegisterResponse {
  success: boolean;
  otp: string;
}

export default function Register(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mocking your backend API response which currently returns the OTP directly
      const mockBackendResponse = await new Promise<MockRegisterResponse>((resolve) =>
        setTimeout(() => resolve({ success: true, otp: '582049' }), 1200)
      );

      if (mockBackendResponse.success) {
        setAlertMessage(`Success! An OTP has been sent to ${email}`);
        
        // Wait 2 seconds to let the user see the alert before redirecting
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              email: email,
              autoFilledOtp: mockBackendResponse.otp
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Registration failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative antialiased text-zinc-50">
      {/* Top Floating Alert */}
      {alertMessage && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-amber-500 text-zinc-950 px-6 py-3 rounded-md shadow-lg font-medium text-sm animate-bounce">
          {alertMessage}
        </div>
      )}

      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 backdrop-blur-sm">
        {/* Header/Brand */}
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500">
            <Film className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Create Admin Account</h2>
          <p className="text-sm text-zinc-400">CineReserve Management Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-zinc-600"
                  placeholder="admin@theatre.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-zinc-600"
                  placeholder="••••••••"
                />
              </div>
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
              'Generate Access OTP'
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs text-zinc-500 hover:text-amber-500 transition-colors"
          >
            Already have an admin account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}