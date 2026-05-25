import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  PenLine,
  Send,
  Calendar,
  Building2,
  ChevronDown,
  Loader2,
  XCircle,
  RefreshCw,
  Share2,
  IndianRupee,
  Trash2,
  Edit,
} from 'lucide-react';
import { useReportStore, useReportSummary } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { useAuthStore } from '../../stores/authStore';
import { useTestStore } from '../../stores/testStore';
import type { Report, ReportStatus } from '../../types';

/**
 * Reports Page - Lists all reports with filtering, search, and workflow actions
 * Connected to backend via reportStore
 */
export function Reports() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');


  // Store state
  const {
    reports,
    isLoading,
    isActionLoading,
    actionId,
    error,
    fetchReports,
    fetchSummary,
    submitReport,
    deleteReport,
    clearError
  } = useReportStore();
  const summary = useReportSummary();
  const { branches, fetchBranches, currentBranchId } = useBranchStore();
  const { can } = useAuthStore();
  const { tests, fetchTests } = useTestStore();

  // Permission checks
  const canEdit = can('report:update');
  const canDelete = can('report:delete');
  const hasAnyAction = canEdit || canDelete || can('report:create') || can('report:read') || can('report:approve');

  /**
   * Get test codes for a report - extracts short codes from test data
   * Example: ["CBC", "KFT"] for multiple tests
   */
  const getTestCodes = (report: Report): string => {
    // If report has test_data with tests array, use test names
    if (report.test_data?.tests && report.test_data.tests.length > 0) {
      return report.test_data.tests
        .map(t => t.testName)
        .join(', ')
        .substring(0, 50); // Limit display length
    }

    // If report has testIds, look them up in the tests list
    if (report.test_data?.testIds && report.test_data.testIds.length > 0) {
      const codes = report.test_data.testIds
        .map(testId => {
          const test = tests.find(t => t.id === testId);
          return test?.test_code || test?.test_name?.substring(0, 4) || 'Test';
        })
        .filter(code => code.length > 0);
      return codes.join(', ');
    }

    // Fallback: use report_type (the old format)
    return report.report_type || 'General Test';
  };

  // Keyboard shortcut: N or A to create new report
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'n' || key === 'a') {
        navigate('/reports/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Fetch data on mount - use currentBranchId as default filter
  useEffect(() => {
    fetchBranches();
    if (currentBranchId) {
      fetchTests(currentBranchId);
    }
  }, [fetchBranches, fetchTests, currentBranchId]);

  // Set initial branch filter to user's current branch
  useEffect(() => {
    if (currentBranchId && branchFilter === 'all' && branches.length <= 1) {
      // Single-branch user: always filter by their branch
      setBranchFilter(currentBranchId);
    }
  }, [currentBranchId, branches.length]);

  // Refetch when branch filter changes
  useEffect(() => {
    const filters = branchFilter !== 'all' ? { branch_id: branchFilter } : {};
    fetchReports(filters);
    fetchSummary(branchFilter !== 'all' ? branchFilter : undefined);
  }, [branchFilter, fetchReports, fetchSummary]);

  /**
   * Get status configuration for display
   */
  const getStatusConfig = (status: ReportStatus) => {
    const configs: Record<ReportStatus, {
      bg: string;
      text: string;
      label: string;
      icon: typeof Clock;
    }> = {
      draft: {
        bg: 'var(--muted)',
        text: 'var(--muted-foreground)',
        label: 'Draft',
        icon: PenLine,
      },
      under_review: {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
        label: 'Under Review',
        icon: Clock,
      },
      approved: {
        bg: 'var(--success)',
        text: 'var(--success-foreground)',
        label: 'Approved',
        icon: CheckCircle,
      },
      rejected: {
        bg: 'var(--destructive)',
        text: 'var(--destructive-foreground)',
        label: 'Rejected',
        icon: XCircle,
      },
      pending: {
        bg: 'var(--muted)',
        text: 'var(--muted-foreground)',
        label: 'Pending',
        icon: Clock,
      },
      'in-progress': {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
        label: 'In Progress',
        icon: Clock,
      },
      completed: {
        bg: 'var(--success)',
        text: 'var(--success-foreground)',
        label: 'Completed',
        icon: CheckCircle,
      },
    };
    return configs[status] || configs.draft;
  };

  /**
   * Get patient display name
   */
  const getPatientName = (report: Report) => {
    return report.patient_name || 'Unknown Patient';
  };

  /**
   * Get technician display name
   */
  const getTechnicianName = (report: Report) => {
    if (report.technician_firstname || report.technician_lastname) {
      return `${report.technician_firstname || ''} ${report.technician_lastname || ''}`.trim();
    }
    return '-';
  };

  /**
   * Get branch display name
   */
  const getBranchName = (report: Report) => {
    // For now, we'll use sample_type as a proxy or show a default
    // This would ideally come from joined branch data
    return report.sample_type || 'Main Branch';
  };

  /**
   * Filter reports based on search and filters
   */
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const patientName = getPatientName(report).toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        patientName.includes(searchLower) ||
        report.patient_id.toLowerCase().includes(searchLower) ||
        report.id.toLowerCase().includes(searchLower) ||
        (report.report_type || '').toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  /**
   * Handle submit for review action
   */
  const handleSubmitForReview = async (reportId: string) => {
    await submitReport(reportId);
  };

  /**
   * Handle delete report with confirmation
   */
  const handleDeleteReport = async (report: Report) => {
    const patientName = getPatientName(report);
    const confirmed = window.confirm(
      `Are you sure you want to delete the report for "${patientName}" (${report.sample_id_code})?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    const success = await deleteReport(report.id);
    if (success) {
      fetchSummary();
    }
  };

  /**
   * Check if report is editable (can enter results)
   */
  const isEditable = (report: Report) => {
    return report.status === 'draft' || report.status === 'rejected';
  };

  /**
   * Render loading state
   */
  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-2 md:p-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs md:text-sm text-destructive">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs text-destructive hover:underline ml-2 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="sticky top-12 z-20 bg-background/95 backdrop-blur py-2 md:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg text-foreground mb-0.5 font-semibold">Reports</h1>
          <p className="text-muted-foreground text-xs line-clamp-2">
            View and manage all laboratory reports
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={() => {
              fetchReports();
              fetchSummary();
            }}
            className="h-8 px-2 md:px-3 flex items-center gap-1.5 rounded text-xs bg-secondary border border-border hover:bg-accent transition-colors flex-1 sm:flex-none justify-center sm:justify-start"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/reports/new"
            className="h-8 px-2 md:px-3 flex items-center gap-1.5 rounded text-xs text-white hover:opacity-90 transition-opacity flex-1 sm:flex-none justify-center sm:justify-start"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Create New Report</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-card border border-border rounded p-2 md:p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Total Reports
          </div>
          <div className="text-lg md:text-xl text-foreground font-semibold">
            {summary?.total || reports.length}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-2 md:p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Draft
          </div>
          <div className="text-lg md:text-xl text-foreground font-semibold">
            {summary?.draft || 0}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-2 md:p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Under Review
          </div>
          <div className="text-lg md:text-xl text-foreground font-semibold">
            {summary?.under_review || 0}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-2 md:p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Approved
          </div>
          <div className="text-lg md:text-xl text-foreground font-semibold">
            {summary?.approved || 0}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded p-2 md:p-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 md:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search patient, ID..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border border-border rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full h-8 pl-2.5 pr-7 bg-secondary border border-border rounded text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Branch Filter - only show when multiple branches */}
          {branches.length > 1 && (
            <div className="relative">
              <select
                className="h-8 pl-2.5 pr-7 bg-secondary border border-border rounded text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Sample ID
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Test Type
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                  Payment
                </th>
                {hasAnyAction && (
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const statusConfig = getStatusConfig(report.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-accent transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground font-medium font-mono">
                            {report.sample_id_code}
                          </span>
                          {report.rejection_reason && (
                            <AlertCircle
                              className="w-3.5 h-3.5"
                              style={{ color: 'var(--destructive)' }}
                              title={report.rejection_reason}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-foreground">
                          {getPatientName(report)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {report.patient_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-foreground">
                          {getTestCodes(report)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.text,
                          }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-foreground">
                          {getTechnicianName(report)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const ps = report.payment_status || 'pending';
                          const cfg: Record<string, { bg: string; text: string; label: string }> = {
                            paid: { bg: 'var(--success)', text: 'var(--success-foreground)', label: 'Paid' },
                            partial: { bg: 'var(--warning)', text: 'var(--warning-foreground)', label: 'Partial' },
                            pending: { bg: 'var(--muted)', text: 'var(--muted-foreground)', label: 'Pending' },
                          };
                          const c = cfg[ps] || cfg.pending;
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                              style={{ backgroundColor: c.bg, color: c.text }}
                            >
                              <IndianRupee className="w-3 h-3" />
                              {c.label}
                            </span>
                          );
                        })()}
                      </td>
                      {hasAnyAction && (
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit/Enter Results - for draft or rejected reports */}
                            {isEditable(report) && canEdit && (
                              <Link
                                to={`/reports/${report.id}/entry`}
                                className="h-7 w-7 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                                title={report.status === 'rejected' ? 'Revise' : 'Enter Results'}
                              >
                                <PenLine className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Edit - for admin and technician on any status */}
                            {canEdit && !isEditable(report) && (
                              <Link
                                to={`/reports/${report.id}/entry?edit=true`}
                                className="h-7 w-7 flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                title="Edit Report"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Submit for Review - for draft reports with test data */}
                            {report.status === 'draft' && report.test_data && canEdit && (
                                <button
                                  onClick={() => handleSubmitForReview(report.id)}
                                  className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                                  title="Submit for Review"
                                  disabled={isActionLoading && actionId === report.id}
                                >
                                  {isActionLoading && actionId === report.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                </button>
                            )}

                            {/* View - for under_review or approved reports */}
                            {(report.status === 'under_review' || report.status === 'approved') && (
                              <Link
                                to={`/reports/preview/${report.id}`}
                                className="h-7 w-7 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                                title="View Report"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Share - for approved reports (opens preview with share modal) */}
                            {report.status === 'approved' && (
                              <Link
                                to={`/reports/preview/${report.id}?share=1`}
                                className="h-7 w-7 flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400"
                                title="Share Report"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Invoice/Bill */}
                            <Link
                              to={`/reports/${report.id}/invoice`}
                              className="h-7 w-7 flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                              title="View Invoice"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete - admin only */}
                            {canDelete && (
                                <button
                                  onClick={() => handleDeleteReport(report)}
                                  className="h-7 w-7 flex items-center justify-center bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                  title="Delete Report"
                                  disabled={isActionLoading && actionId === report.id}
                                >
                                  {isActionLoading && actionId === report.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={hasAnyAction ? 8 : 7} className="px-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? 'Loading reports...' : 'No reports found matching your filters'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
