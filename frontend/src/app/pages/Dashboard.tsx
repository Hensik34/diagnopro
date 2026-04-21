import { useEffect } from 'react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar';
import { StaffDashboard } from '../components/dashboard/StaffDashboard';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';

export function Dashboard() {
  const { reports, fetchReports, isLoading } = useReportStore();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchReports({});
  }, [fetchReports]);

  const handleRefresh = () => {
    fetchReports({});
  };

  // Staff / Technician / Doctor see a different dashboard
  if (!isAdmin) {
    return <StaffDashboard />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Dashboard</h1>
          <p className="text-muted-foreground text-xs">
            Monitor and manage laboratory operations across all branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Calendar View */}
      <DashboardCalendar reports={reports} />
    </div>
  );
}