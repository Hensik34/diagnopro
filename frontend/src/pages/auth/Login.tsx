import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../stores';

/**
 * Login Page Component
 * Single unified login — backend determines if user is admin/staff or doctor
 */
export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { fetchBranches } = useBranchStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login({ email, password });
    
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
              <label htmlFor="password" className="block text-sm text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

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
