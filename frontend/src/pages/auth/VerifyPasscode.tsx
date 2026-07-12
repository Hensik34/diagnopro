import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../stores';

export function VerifyPasscode() {
  const navigate = useNavigate();
  const { verifyLoginOtp, resendLoginOtp, pendingEmail, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { fetchBranches } = useBranchStore();

  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Direct access protection
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    } else if (!pendingEmail) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, pendingEmail, navigate]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Show error toast if any
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit passcode.');
      return;
    }

    const success = await verifyLoginOtp(otp);

    if (success) {
      toast.success('Identity verified successfully.');
      
      // Post-login branch check (same as Login.tsx)
      try {
        await fetchBranches();
        const branches = useBranchStore.getState().branches;
        if (branches.length === 0) {
          navigate('/onboarding');
        } else {
          localStorage.setItem('onboarding_complete', 'true');
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    clearError();

    const success = await resendLoginOtp();
    if (success) {
      toast.success('A new passcode has been sent to your email.');
      setCooldown(30); // 30 seconds cooldown
      setOtp('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  if (!pendingEmail) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Back to Login link */}
        <button
          onClick={() => {
            useAuthStore.setState({ pendingEmail: null, pendingOtpVerification: false });
            navigate('/login');
          }}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </button>

        <div className="p-8 bg-card border border-border rounded-lg shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Security Verification
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              For your account's safety, we sent a 6-digit verification passcode to:
            </p>
            <p className="text-sm font-semibold text-foreground mt-1 break-all">
              {pendingEmail}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="passcode" className="block text-center text-sm text-muted-foreground mb-3">
                Enter your 6-digit passcode
              </label>
              
              <div className="relative flex justify-center">
                <input
                  ref={inputRef}
                  id="passcode"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                  }}
                  className="w-56 h-12 text-center text-2xl font-bold tracking-[0.6em] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/30 font-mono pl-3"
                  placeholder="000000"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-10 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Identity'
              )}
            </button>

            {/* Resend Cooldown Section */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Didn't receive the passcode?</span>{' '}
              {cooldown > 0 ? (
                <span className="text-muted-foreground font-medium">
                  Resend code in {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-primary hover:underline font-medium focus:outline-none disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
