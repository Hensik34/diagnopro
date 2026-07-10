import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Building2 } from 'lucide-react';
import { Sidebar } from '../../app/components/layout/Sidebar';
import { TopNav } from '../../app/components/layout/TopNav';
import { DoctorBottomNav } from '../../app/components/layout/DoctorBottomNav';
import { ThemeProvider } from 'next-themes';
import { useAuthStore, useBranchStore } from '../../stores';
import { onLogout, offLogout } from '../../stores/resetStores';

// Storage key for sidebar state
const SIDEBAR_STATE_KEY = 'diagnopro_sidebar_state';


export function Root() {
  const location = useLocation();
  const isReportEntry = location.pathname.includes('/reports/entry') || 
    /\/reports\/[^/]+\/entry/.test(location.pathname) || 
    location.pathname.includes('/reports/preview');

  // Initialize from localStorage, default to true (collapsed) for mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return true; // Always collapsed on mobile
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default collapsed on desktop too
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  const { isAuthenticated, isLoading: authLoading, user, initialize, can, getBranchRole } = useAuthStore();
  const { branches, fetchBranches, currentBranchId, isSwitchingBranch, isLoading: branchesLoading } = useBranchStore();

  const isDoctor = getBranchRole() === 'doctor';
  const [branchesFetched, setBranchesFetched] = useState(false);

  // Get the name of the branch being switched to (for the overlay)
  const switchingToBranch = branches.find(b => b.id === currentBranchId);

  // Check if user has permission to access admin/staff features (not a doctor-only user)
  const hasAdminStaffAccess = can('branch:read') || can('patient:read');

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Always collapse sidebar on mobile, respect user preference on desktop
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Reset local state when any user logs out.
  // Without this, `branchesFetched` stays true across user switches
  // and the new user's branches never get fetched.
  useEffect(() => {
    const handleLogout = () => {
      setBranchesFetched(false);
    };
    onLogout(handleLogout);
    return () => offLogout(handleLogout);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch branches when authenticated AND user profile is loaded
  // IMPORTANT: Wait for !authLoading && user to avoid premature skip
  // All users (including doctors) now get branches from their respective tables
  useEffect(() => {
    if (!isAuthenticated || authLoading || !user || branchesFetched) return;

    fetchBranches().then(() => setBranchesFetched(true));
  }, [isAuthenticated, authLoading, user, fetchBranches, branchesFetched]);

  // Check for first-time setup (no branches) - only for admin/staff users
  useEffect(() => {
    if (!hasAdminStaffAccess) return;
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    if (isAuthenticated && !authLoading && branchesFetched && !branchesLoading && branches.length === 0 && !onboardingComplete) {
      if (!window.location.pathname.startsWith('/onboarding')) {
        navigate('/onboarding', { replace: true });
      }
    }
    if (branchesFetched && branches.length > 0) {
      localStorage.setItem('onboarding_complete', 'true');
    }
  }, [isAuthenticated, authLoading, branches, branchesFetched, branchesLoading, navigate, hasAdminStaffAccess]);

  // Show loading while auth is initializing
  // KEY: Also wait for `user` to be loaded when we have a token.
  // Without the `!user` check, there's a gap on refresh:
  //   isAuthenticated=true (from token), authLoading=false (not yet started), user=null
  // During that gap, <Outlet/> would render and children would see null user.
  // This ONE guard protects ALL child pages — no per-component checks needed.
  if (authLoading || (!user && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background">
        {/* Full-screen Branch Switching Overlay */}
        {isSwitchingBranch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Switching branch...</p>
                {switchingToBranch && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Loading {switchingToBranch.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!isReportEntry && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarHidden={isReportEntry}
        />
        <main
          className={`pt-12 transition-all duration-200 print:ml-0 print:pt-0 print:p-0 ${
            isReportEntry ? 'ml-0' : (sidebarCollapsed ? 'ml-0 md:ml-14' : 'ml-0 md:ml-56')
          } ${isDoctor ? 'pb-16 md:pb-0' : ''}`}
        >
          <div className={`${isReportEntry ? 'px-3 py-2 w-full max-w-full mx-auto print:p-0' : 'px-4 py-4 md:px-6 md:py-6 lg:px-8 w-full max-w-full print:p-0'}`}>
            <Outlet />
          </div>
        </main>
        {isDoctor && <DoctorBottomNav />}
      </div>
    </ThemeProvider>
  );
}