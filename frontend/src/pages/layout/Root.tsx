import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from '../../app/components/layout/Sidebar';
import { TopNav } from '../../app/components/layout/TopNav';
import { ThemeProvider } from 'next-themes';
import { useAuthStore, useBranchStore } from '../../stores';

export function Root() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const { isAuthenticated, isLoading: authLoading, user, initialize, can } = useAuthStore();
  const { branches, fetchBranches, currentBranchId, setCurrentBranchId, isLoading: branchesLoading } = useBranchStore();
  const [branchesFetched, setBranchesFetched] = useState(false);

  // Check if user has permission to access admin/staff features (not a doctor-only user)
  const hasAdminStaffAccess = can('branch:read') || can('patient:read');

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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

  // Show loading while checking auth
  if (authLoading) {
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
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <TopNav sidebarCollapsed={sidebarCollapsed} />
        <main
          className={`pt-12 transition-all duration-200 print:ml-0 print:pt-0 print:p-0 ${
            sidebarCollapsed ? 'ml-14' : 'ml-56'
          }`}
        >
          <div className="p-4 max-w-[1440px] mx-auto print:p-0 print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}