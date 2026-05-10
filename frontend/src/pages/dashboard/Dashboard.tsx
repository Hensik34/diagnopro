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
  const { user, getBranchRole, can } = useAuthStore();
  const { currentBranchId } = useBranchStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="sticky top-12 z-20 bg-background/95 backdrop-blur py-2 flex items-start justify-between">
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
      <SummaryCards selectedMonth={selectedMonth} reports={reports} />

      {/* Calendar View */}
      <DashboardCalendar reports={reports} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
    </div>
  );
}