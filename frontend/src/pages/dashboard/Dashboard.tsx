import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { SummaryCards } from '../../app/components/dashboard/SummaryCards';
import { DashboardCalendar } from '../../app/components/dashboard/DashboardCalendar';
import { StaffDashboard } from '../../app/components/dashboard/StaffDashboard';
import { DoctorDashboard } from '../doctor-portal/DoctorDashboard';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useReportStore } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/permissions';

export function Dashboard() {
  const { reports, fetchReports, isLoading } = useReportStore();
  const { getBranchRole, can } = useAuthStore();
  const { currentBranchId } = useBranchStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Safe to use — Root.tsx guarantees user is loaded before this component renders
  const currentRole = getBranchRole();
  const isAdmin = can(PERMISSIONS.USER_MANAGE_ROLES);
  const isDoctor = currentRole === 'doctor';
  const isPathologist = currentRole === 'pathologist';

  useEffect(() => {
    if (!isDoctor && !isPathologist) {
      const filters = currentBranchId ? { branch_id: currentBranchId } : {};
      fetchReports(filters);
    }
  }, [fetchReports, currentBranchId, isDoctor, isPathologist]);

  const handleRefresh = () => {
    const filters = currentBranchId ? { branch_id: currentBranchId } : {};
    fetchReports(filters);
  };

  // Doctor gets their own dashboard
  if (isDoctor) {
    return <DoctorDashboard />;
  }

  // Pathologist gets redirected directly to Report Review
  if (isPathologist) {
    return <Navigate to="/app/reports/review" replace />;
  }

  // Staff / Technician see a different dashboard
  if (!isAdmin) {
    return <StaffDashboard />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Dashboard</h1>
          <p className="text-muted-foreground text-xs">
            Monitor and manage laboratory operations across all branches
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-3 flex items-center justify-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex-1 sm:flex-none cursor-pointer"
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
      <SummaryCards selectedMonth={selectedMonth} reports={reports} />

      {/* Calendar View */}
      <DashboardCalendar reports={reports} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
    </div>
  );
}