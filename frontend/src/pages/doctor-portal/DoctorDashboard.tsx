import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  Users,
  IndianRupee,
  TrendingUp,
  Loader2,
  RefreshCw,
  ArrowRight,
  Calendar,
  Stethoscope,
  Eye,
} from 'lucide-react';
import { doctorPortalApi } from '../../api/doctorPortal';
import type { DoctorDashboardData } from '../../api/doctorPortal';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DoctorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Statement filter
  const [stmtStart, setStmtStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [stmtEnd, setStmtEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [statement, setStatement] = useState<any>(null);
  const [stmtLoading, setStmtLoading] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await doctorPortalApi.getDashboard();
      setDashboard(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatement = async () => {
    setStmtLoading(true);
    try {
      const res = await doctorPortalApi.getMyStatement(stmtStart, stmtEnd);
      setStatement(res.data);
    } catch {
      // silently fail
    } finally {
      setStmtLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (stmtStart && stmtEnd) {
      fetchStatement();
    }
  }, [stmtStart, stmtEnd]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Stethoscope className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Doctor Portal</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { doctor, allTime, thisMonth, recentReports } = dashboard;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">
            {greeting()}, {doctor.name}
          </h1>
          <p className="text-muted-foreground text-xs">
            Monitor and manage referred patients and reports
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex-1 sm:flex-none cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* This Month Highlight */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">This Month</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{thisMonth.reports}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Reports Referred</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(thisMonth.revenue)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Revenue Generated</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{formatCurrency(thisMonth.commission)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Revenue Earned</div>
          </div>
        </div>
      </div>

      {/* All Time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Reports</span>
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{allTime.total_reports}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{allTime.approved_reports} approved</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Patients</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{allTime.total_patients}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Unique referrals</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Revenue</span>
            <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{formatCurrency(allTime.total_revenue)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Total generated</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Revenue Sharing</span>
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          </div>
          <div className="text-foreground text-xl tabular-nums text-green-600 dark:text-green-400">{formatCurrency(allTime.total_commission)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Total earned</div>
        </div>
      </div>

      {/* Revenue Statement */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-foreground text-sm font-medium">Revenue Statement</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={stmtStart}
              onChange={(e) => setStmtStart(e.target.value)}
              className="h-7 px-2 text-xs border border-border rounded bg-secondary text-foreground"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={stmtEnd}
              onChange={(e) => setStmtEnd(e.target.value)}
              className="h-7 px-2 text-xs border border-border rounded bg-secondary text-foreground"
            />
          </div>
        </div>

        {stmtLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : statement ? (
          <>
            <div className="grid grid-cols-3 gap-0 border-b border-border">
              <div className="p-3 text-center border-r border-border">
                <div className="text-lg font-bold text-foreground tabular-nums">{statement.summary.total_reports}</div>
                <div className="text-[10px] text-muted-foreground">Reports</div>
              </div>
              <div className="p-3 text-center border-r border-border">
                <div className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(statement.summary.total_amount)}</div>
                <div className="text-[10px] text-muted-foreground">Revenue</div>
              </div>
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">{formatCurrency(statement.summary.total_commission)}</div>
                <div className="text-[10px] text-muted-foreground">Your Revenue Share</div>
              </div>
            </div>

            {statement.reports.length > 0 && (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full">
                  <thead className="bg-secondary/30 sticky top-0">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Revenue Share</th>
                      <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statement.reports.map((report: any) => (
                      <tr key={report.report_id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-3 py-2 text-xs text-foreground">
                          {new Date(report.report_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{report.patient_name}</td>
                        <td className="px-3 py-2 text-xs text-foreground text-center tabular-nums">{formatCurrency(report.report_amount)}</td>
                        <td className="px-3 py-2 text-xs text-green-600 dark:text-green-400 text-center tabular-nums font-medium">{formatCurrency(report.doctor_commission)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                            report.status === 'approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : report.status === 'draft'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{report.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Recent Reports */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">Recent Referrals</h2>
          <button
            onClick={() => navigate('/app/doctor-reports')}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No referrals yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Revenue Share</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="text-xs text-foreground font-medium">{report.patient_name}</div>
                      <div className="text-[10px] text-muted-foreground">{report.patient_phone}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground text-center tabular-nums">{formatCurrency(report.report_amount)}</td>
                    <td className="px-3 py-2 text-xs text-green-600 dark:text-green-400 text-center tabular-nums font-medium">
                      {formatCurrency(report.doctor_commission)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                        report.status === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{report.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground text-center">
                      {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => navigate(`/app/reports/preview/${report.id}`)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                        title="View Report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
