import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../stores';
import { authApi } from '../../api';

/**
 * Register Page Component
 * New user registration with redirect to onboarding
 */
export function Register() {
  const navigate = useNavigate();
  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { fetchBranches } = useBranchStore();

  useEffect(() => {
    const handleGoogleCredentialResponse = async (response: any) => {
      clearError();
      const success = await googleLogin(response.credential);
      
      if (success) {
        const user = useAuthStore.getState().user;

        // Doctor login: skip onboarding check, go straight to dashboard
        if (user?.role === 'doctor') {
          fetchBranches().catch(() => {});
          navigate('/');
          return;
        }

        // Lab admin/staff login: check for onboarding
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

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1068884242636-placeholder.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("google-signup-button"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    // Script might load asynchronously
    if ((window as any).google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initializeGoogleSignIn();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, [googleLogin, clearError, fetchBranches, navigate]);
  
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [validationError, setValidationError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced email check
  useEffect(() => {
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);

    const email = formData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('idle');
      return;
    }

    setEmailStatus('checking');
    emailCheckTimer.current = setTimeout(async () => {
      try {
        const result = await authApi.checkEmail(email);
        setEmailStatus(result.exists ? 'taken' : 'available');
      } catch {
        setEmailStatus('idle');
      }
    }, 500);

    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    };
  }, [formData.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Check email availability
    if (emailStatus === 'taken') {
      setValidationError('This email is already registered');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    const success = await register({
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    });
    
    if (success) {
      // New users go to onboarding to set up their first branch
      navigate('/onboarding');
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground mb-2 text-center">
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Register to start managing your lab
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {displayError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {displayError}
            </div>
          )}
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstname" className="block text-sm text-muted-foreground mb-1.5">
                First Name
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                value={formData.firstname}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="John"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="lastname" className="block text-sm text-muted-foreground mb-1.5">
                Last Name
              </label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm text-muted-foreground mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-10 px-3 pr-9 bg-background border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  emailStatus === 'taken' ? 'border-destructive' : emailStatus === 'available' ? 'border-green-500' : 'border-border'
                }`}
                placeholder="john@example.com"
                required
                disabled={isLoading}
              />
              {emailStatus === 'checking' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              )}
              {emailStatus === 'available' && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {emailStatus === 'taken' && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            {emailStatus === 'taken' && (
              <p className="text-xs text-destructive mt-1">This email is already registered</p>
            )}
          </div>

          {/* Phone Input (Optional) */}
          <div>
            <label htmlFor="phone" className="block text-sm text-muted-foreground mb-1.5">
              Phone <span className="text-xs">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="+1 234 567 8900"
              disabled={isLoading}
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Min 6 characters"
              required
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-muted-foreground mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || emailStatus === 'taken' || emailStatus === 'checking'}
            className="w-full h-10 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <span className="relative px-2 bg-card text-xs text-muted-foreground uppercase">
              Or continue with
            </span>
          </div>

          {/* Google Sign-up Button */}
          <div className="flex justify-center">
            <div id="google-signup-button" className="w-full"></div>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
