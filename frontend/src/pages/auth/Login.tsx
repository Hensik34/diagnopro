import { useState, useEffect, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../stores';

/**
 * Login Page Component
 * Single unified login — backend determines if user is admin/staff or doctor
 */
export function Login() {
  const navigate = useNavigate();
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { fetchBranches } = useBranchStore();

  useEffect(() => {
    const handleGoogleCredentialResponse = async (response: any) => {
      clearError();
      const result = await googleLogin(response.credential);
      
      if (result.success) {
        if (result.requiresOtp) {
          navigate('/verify-passcode');
          return;
        }

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
          document.getElementById("google-signin-button"),
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

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await login({ email, password });
    
    if (result.success) {
      if (result.requiresOtp) {
        navigate('/verify-passcode');
        return;
      }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="p-8 bg-card border border-border rounded-lg shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              DiagnoPro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            
            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm text-muted-foreground">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
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

            {/* Google Sign-in Button */}
            <div className="flex justify-center">
              <div id="google-signin-button" className="w-full"></div>
            </div>

            {/* Register Link */}
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Register
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
