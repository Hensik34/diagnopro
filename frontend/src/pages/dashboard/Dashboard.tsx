import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!isDoctor) {
      const filters = currentBranchId ? { branch_id: currentBranchId } : {};
      fetchReports(filters);
    }
  }, [fetchReports, currentBranchId, isDoctor]);

  const handleRefresh = () => {
    const filters = currentBranchId ? { branch_id: currentBranchId } : {};
    fetchReports(filters);
  };

  // Doctor gets their own dashboard
  if (isDoctor) {
    return <DoctorDashboard />;
  }

  // Staff / Technician see a different dashboard
  if (!isAdmin) {
    return <StaffDashboard />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="sticky top-12 z-20 bg-background/95 backdrop-blur py-2 md:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-foreground mb-0.5">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
            Monitor and manage laboratory operations across all branches
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 md:h-9 px-3 md:px-4 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs md:text-sm disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards selectedMonth={selectedMonth} reports={reports} />

      {/* Calendar View */}
      <DashboardCalendar reports={reports} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
    </div>
  );
}