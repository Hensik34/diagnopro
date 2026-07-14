import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAuthStore, useBranchStore } from "../../stores";

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { fetchBranches } = useBranchStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          navigate('/app');
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
            navigate('/app');
          }
        } catch {
          navigate('/app');
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
        navigate('/app');
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
          navigate('/app');
        }
      } catch {
        navigate('/app');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome Back to DiagnoPro
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Access your laboratory management dashboard and continue streamlining your operations.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-gray-700">Secure HIPAA-compliant access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-gray-700">Real-time data synchronization</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-gray-700">Access from anywhere, anytime</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/20 p-6 md:p-8 border border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Google Sign-in Button */}
                <div className="flex justify-center mt-4">
                  <div id="google-signin-button" className="w-full"></div>
                </div>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                    Request a Demo
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  Need help?{" "}
                  <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
