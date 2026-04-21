import { Loader2 } from 'lucide-react';
import { usePatientStore, useBranchStore, useDoctorStore, useTestStore, useReportStore } from '../../../stores';
import { useEffect, useMemo } from 'react';

interface SummaryCard {
  title: string;
  value: string | number;
  subtitle: string;
  type: 'default' | 'success' | 'warning' | 'danger';
}

export function SummaryCards() {
  const { patients, fetchPatients, isLoading: patientsLoading } = usePatientStore();
  const { branches, fetchBranches, currentBranchId, isLoading: branchesLoading } = useBranchStore();
  const { doctors, fetchDoctors, isLoading: doctorsLoading } = useDoctorStore();
  const { tests, fetchTests, isLoading: testsLoading } = useTestStore();
  const { reports } = useReportStore();

  // Fetch data on mount / branch change
  useEffect(() => {
    fetchBranches();
    fetchDoctors();
    if (currentBranchId) {
      fetchTests(currentBranchId);
    }
  }, [fetchBranches, fetchDoctors, fetchTests, currentBranchId]);

  // Fetch patients only when branch is available (API requires branch_id)
  useEffect(() => {
    if (currentBranchId) {
      fetchPatients({ branch_id: currentBranchId });
    }
  }, [currentBranchId, fetchPatients]);

  const totalRevenue = useMemo(() => {
    return reports.reduce((sum, r) => sum + (Number(r.report_amount) || 0), 0);
  }, [reports]);

  const isLoading = (patientsLoading || branchesLoading || doctorsLoading || testsLoading)
    && patients.length === 0 && branches.length === 0 && doctors.length === 0 && tests.length === 0;

  const cards: SummaryCard[] = [
    {
      title: 'Total Patients',
      value: patients.length,
      subtitle: 'Registered',
      type: 'default',
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: `From ${reports.length} reports`,
      type: 'success',
    },
    {
      title: 'Doctors',
      value: doctors.length,
      subtitle: 'Registered',
      type: 'warning',
    },
    {
      title: 'Tests',
      value: tests.length,
      subtitle: 'Configured',
      type: 'success',
    },
  ];

  const getTypeColor = (type: SummaryCard['type']) => {
    switch (type) {
      case 'success':
        return 'var(--success)';
      case 'warning':
        return 'var(--warning)';
      case 'danger':
        return 'var(--destructive)';
      default:
        return 'var(--primary)';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded p-3">
            <div className="animate-pulse">
              <div className="h-3 bg-secondary rounded w-20 mb-3"></div>
              <div className="h-8 bg-secondary rounded w-16 mb-2"></div>
              <div className="h-3 bg-secondary rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card border border-border rounded p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
              {card.title}
            </span>
          </div>
          <div className="mb-1.5">
            <span className="text-foreground text-2xl tracking-tight tabular-nums">
              {card.value}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">{card.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
