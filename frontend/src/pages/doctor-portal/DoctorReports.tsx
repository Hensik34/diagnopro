import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { doctorPortalApi } from '../../api/doctorPortal';
import type { DoctorPortalReport, Pagination } from '../../api/doctorPortal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function DoctorReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DoctorPortalReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await doctorPortalApi.getMyReports({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setReports(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">My Reports</h1>
          <p className="text-muted-foreground text-xs">
            All reports from patients you referred
            {pagination && ` • ${pagination.total} total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-8 px-2 text-xs border border-border rounded bg-card text-foreground"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                  <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Revenue Share</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="text-xs text-foreground font-medium">{report.patient_name || 'Unknown'}</div>
                      <div className="text-[10px] text-muted-foreground">{report.patient_phone}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{report.report_type || '-'}</td>
                    <td className="px-3 py-2.5 text-xs text-foreground text-center tabular-nums">{formatCurrency(report.report_amount)}</td>
                    <td className="px-3 py-2.5 text-xs text-green-600 dark:text-green-400 text-center tabular-nums font-medium">
                      {formatCurrency(report.doctor_commission)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${getStatusBadge(report.status)}`}>
                        {report.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground text-center">
                      {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => navigate(`/reports/preview/${report.id}`)}
                        className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-3 py-2.5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-foreground px-2 tabular-nums">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
