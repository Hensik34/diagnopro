import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { CustomConfirmModal } from '../../app/components/ui/CustomConfirmModal';
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
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useReportStore, useReportSummary } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { useAuthStore } from '../../stores/authStore';
import { useTestStore } from '../../stores/testStore';
import type { Report, ReportStatus } from '../../types';
import { InvoiceModal } from '../../app/components/reports/InvoiceModal';
import { ReceiptModal } from '../../app/components/reports/ReceiptModal';
import { BillingOptionModal } from '../../app/components/reports/BillingOptionModal';

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Reports Page - Lists all reports with filtering, search, and workflow actions
 * Connected to backend via reportStore
 */
export function Reports() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(() => {
    return sessionStorage.getItem('diagnopro_reports_date_filter') || getLocalDateString();
  });
  const [sortField, setSortField] = useState<'sample_id_code' | 'patient_name' | 'test_type' | 'doctor' | 'status' | 'created_at' | 'technician' | 'payment_status'>('created_at');

  const handleDateChange = (val: string) => {
    const newDate = val || getLocalDateString();
    setDateFilter(newDate);
    sessionStorage.setItem('diagnopro_reports_date_filter', newDate);
  };
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-foreground shrink-0" />
      : <ArrowDown className="w-3 h-3 text-foreground shrink-0" />;
  };

  // Payment modal state
  const [billingAction, setBillingAction] = useState<{
    reportId: string;
    type: 'option' | 'bill' | 'receipt';
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'danger' | 'warning' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });


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
  const { can, user } = useAuthStore();
  const { tests, fetchTests } = useTestStore();

  // Redirect doctors to doctor-reports
  useEffect(() => {
    if (user?.role === 'doctor') {
      navigate('/doctor-reports', { replace: true });
    }
  }, [user, navigate]);

  // Permission checks
  const canEdit = can('report:update');
  const canDelete = can('report:delete');
  const hasAnyAction = canEdit || canDelete || can('report:create') || can('report:read') || can('report:approve');

  console.log('RBAC Reports Table Debug:', {
    userRole: useAuthStore.getState().user?.role,
    canEdit,
    canDelete,
    canRead: can('report:read'),
    canApprove: can('report:approve'),
    hasAnyAction,
    reportsCount: reports.length
  });

  /**
   * Get test codes for a report - extracts short codes from test data
   * Example: ["CBC", "KFT"] for multiple tests
   */
  const getTestCodes = (report: Report): string => {
    const cleanCode = (code: string): string => {
      return code.replace(/[-_]\d+$/, '').toUpperCase();
    };

    const extractParentheses = (name: string): string | null => {
      const match = name.match(/\(([^)]+)\)/);
      return match ? match[1].trim() : null;
    };

    const findCode = (testName?: string, testId?: string): string | null => {
      if (testId) {
        const test = tests.find(t => t.id === testId);
        if (test?.test_code) return cleanCode(test.test_code);
      }
      if (testName) {
        const test = tests.find(t => t.test_name.toLowerCase() === testName.toLowerCase());
        if (test?.test_code) return cleanCode(test.test_code);
        
        const codeInParen = extractParentheses(testName);
        if (codeInParen) return cleanCode(codeInParen);
      }
      return null;
    };

    // Check if there are snapshotted packages first
    if (report.pricing_snapshot && report.pricing_snapshot.length > 0) {
      const packageNames = report.pricing_snapshot
        .filter(item => item.package_id)
        .map(item => item.package_name)
        .filter(Boolean) as string[];

      const standaloneTests = report.pricing_snapshot
        .filter(item => !item.package_id && item.test_id)
        .map(item => item.test_code)
        .filter(Boolean) as string[];

      if (packageNames.length > 0) {
        if (standaloneTests.length > 0) {
          return `${packageNames.join(', ')} + ${standaloneTests.join(', ')}`;
        }
        return packageNames.join(', ');
      }
    }

    // 1. Grouped structure
    if (report.test_data?.tests && report.test_data.tests.length > 0) {
      const codes = report.test_data.tests.map(t => {
        return findCode(t.testName, t.testId) || t.testName;
      });
      return codes.join(', ');
    }

    // 2. Flat structure with testIds
    if (report.test_data?.testIds && report.test_data.testIds.length > 0) {
      const codes = report.test_data.testIds.map(testId => {
        const test = tests.find(t => t.id === testId);
        return test?.test_code ? cleanCode(test.test_code) : (extractParentheses(test?.test_name || '') || test?.test_name || 'Test');
      });
      return codes.join(', ');
    }

    // 3. Fallback: use report_type (comma-separated string or old format)
    if (report.report_type) {
      const parts = report.report_type.split(',').map(p => p.trim());
      const codes = parts.map(part => {
        return findCode(part) || part;
      });
      return codes.join(', ');
    }

    return 'General Test';
  };

  // Keyboard shortcut: N or A to create new report
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'n' || key === 'a') {
        navigate('/app/reports/new');
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

  // Refetch when branch changes (always scoped to current branch)
  useEffect(() => {
    if (!currentBranchId) return;
    fetchReports({ branch_id: currentBranchId });
    fetchSummary(currentBranchId);
    fetchTests(currentBranchId);
  }, [currentBranchId, fetchReports, fetchSummary, fetchTests]);

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
      created: {
        bg: 'var(--muted)',
        text: 'var(--muted-foreground)',
        label: 'Created',
        icon: Clock,
      },
      collected: {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
        label: 'Collected',
        icon: Clock,
      },
      processing: {
        bg: 'var(--warning)',
        text: 'var(--warning-foreground)',
        label: 'Processing',
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
   * Get doctor display name
   */
  const getDoctorName = (report: Report) => {
    if (report.is_self_report) return 'Self';
    if (report.doctor_name) {
      if (/^dr\.?/i.test(report.doctor_name)) {
        return report.doctor_name;
      }
      return `${report.doctor_title || 'Dr'}. ${report.doctor_name}`;
    }
    if (report.doctor_firstname || report.doctor_lastname) {
      return `${report.doctor_title || 'Dr'}. ${report.doctor_firstname || ''} ${report.doctor_lastname || ''}`.trim();
    }
    return 'Self';
  };

  /**
   * Get branch display name
   */
  const getBranchName = (report: Report) => {
    // For now, we'll use sample_type as a proxy or show a default
    // This would ideally come from joined branch data
    return report.sample_type || 'Main Branch';
  };

  const getPatientIdPreview = (report: Report) => {
    const patientId = report.patient_id || '';
    return patientId ? patientId.slice(0, 8) : '-';
  };

  const dateSpecificSummary = useMemo(() => {
    let total = 0;
    let draft = 0;
    let under_review = 0;
    let approved = 0;

    reports.forEach((report) => {
      if (report.created_at) {
        try {
          const reportDate = new Date(report.created_at);
          const reportLocalDateStr = getLocalDateString(reportDate);
          if (reportLocalDateStr === dateFilter) {
            total++;
            if (report.status === 'draft') draft++;
            else if (report.status === 'under_review') under_review++;
            else if (report.status === 'approved') approved++;
          }
        } catch (e) {
          console.error("Invalid report created_at date:", report.created_at, e);
        }
      }
    });

    return { total, draft, under_review, approved };
  }, [reports, dateFilter]);

  /**
   * Filter reports based on search and filters
   */
  /**
   * Filter and sort reports based on search, filters, and selected column
   */
  const sortedAndFilteredReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      const patientName = getPatientName(report).toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        patientName.includes(searchLower) ||
        (report.patient_id || '').toLowerCase().includes(searchLower) ||
        (report.sample_id_code || '').toLowerCase().includes(searchLower) ||
        report.id.toLowerCase().includes(searchLower) ||
        (report.report_type || '').toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' || report.status === statusFilter;

      let matchesDate = true;
      if (dateFilter && report.created_at) {
        try {
          const reportDate = new Date(report.created_at);
          const reportLocalDateStr = getLocalDateString(reportDate);
          matchesDate = reportLocalDateStr === dateFilter;
        } catch (e) {
          console.error("Invalid report created_at date:", report.created_at, e);
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'sample_id_code') {
        aVal = a.sample_id_code || '';
        bVal = b.sample_id_code || '';
      } else if (sortField === 'patient_name') {
        aVal = getPatientName(a);
        bVal = getPatientName(b);
      } else if (sortField === 'test_type') {
        aVal = getTestCodes(a);
        bVal = getTestCodes(b);
      } else if (sortField === 'doctor') {
        aVal = getDoctorName(a);
        bVal = getDoctorName(b);
      } else if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      } else if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortField === 'technician') {
        aVal = getTechnicianName(a);
        bVal = getTechnicianName(b);
      } else if (sortField === 'payment_status') {
        aVal = a.payment_status || 'pending';
        bVal = b.payment_status || 'pending';
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc'
          ? (aVal > bVal ? 1 : aVal < bVal ? -1 : 0)
          : (bVal > aVal ? 1 : bVal < aVal ? -1 : 0);
      }
    });
  }, [reports, searchQuery, statusFilter, dateFilter, sortField, sortOrder, tests]);

  const refreshReportsData = useCallback(async () => {
    if (!currentBranchId) return;
    await fetchReports({ branch_id: currentBranchId });
    await fetchSummary(currentBranchId);
  }, [currentBranchId, fetchReports, fetchSummary]);

  const handleRowDoubleClick = (report: Report) => {
    if (report.status === 'draft' || report.status === 'rejected') {
      navigate(`/app/reports/${report.id}/entry`);
      return;
    }
    if (report.status === 'approved') {
      navigate(`/app/reports/preview/${report.id}`);
    }
  };

  /**
   * Handle submit for review action
   */
  const isReportReadyForSubmit = (report: Report) => {
    const grouped = report.test_data?.tests || [];
    const fromGrouped = grouped.flatMap((group) => group.parameters || []);
    const flat = report.test_data?.parameters || [];
    const allParams = fromGrouped.length > 0 ? fromGrouped : flat;

    if (allParams.length === 0) return false;

    const nonCalculated = allParams.filter((param) => (param as any).fieldType !== 'calculated');
    const requiredParams = nonCalculated.length > 0 ? nonCalculated : allParams;

    return requiredParams.every((param) => {
      const value = param.value;
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  };

  const handleSubmitForReview = async (report: Report) => {
    if (!isReportReadyForSubmit(report)) {
      setConfirmModal({
        isOpen: true,
        title: 'Action Required',
        message: 'Please fill all required test values before submitting for review.',
        type: 'alert',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    await submitReport(report.id);
  };

  /**
   * Handle delete report with confirmation
   */
  const handleDeleteReport = (report: Report) => {
    const patientName = getPatientName(report);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Report',
      message: `Are you sure you want to delete the report for "${patientName}" (${report.sample_id_code})?\n\nThis action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        const success = await deleteReport(report.id);
        if (success) {
          fetchSummary();
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Reports</h1>
          <p className="text-muted-foreground text-xs">
            View and manage all laboratory reports
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={() => {
              refreshReportsData();
            }}
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 rounded text-xs bg-secondary border border-border hover:bg-accent transition-colors flex-1 sm:flex-none cursor-pointer"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/app/reports/new"
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 rounded text-xs text-white hover:opacity-90 transition-opacity flex-1 sm:flex-none cursor-pointer"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <FileText className="w-3.5 h-3.5" />
            Create New Report
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Total Reports</span>
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {dateSpecificSummary.total}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">All report entries</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Draft</span>
            <Edit className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {dateSpecificSummary.draft}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">In progress</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Under Review</span>
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {dateSpecificSummary.under_review}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Awaiting validation</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Approved</span>
            <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {dateSpecificSummary.approved}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Ready & finalized</span>
          </div>
        </div>
      </div> */}

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded p-2 md:p-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 md:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search patient, ID..."
              className="w-full h-8 pl-8 pr-8 bg-secondary border border-border rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full h-8 pl-2.5 pr-7 bg-secondary border border-border rounded text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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

          {/* Date Filter */}
          <div className="relative w-full sm:w-auto flex items-center gap-1.5">
            <input
              type="date"
              className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-foreground"
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0">
              <tr className="border-b border-border">
                <th 
                  onClick={() => handleSort('sample_id_code')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Sample ID {renderSortIcon('sample_id_code')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('patient_name')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Patient {renderSortIcon('patient_name')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('doctor')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Doctor {renderSortIcon('doctor')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('test_type')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Test Type {renderSortIcon('test_type')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Status {renderSortIcon('status')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('created_at')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Created {renderSortIcon('created_at')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('technician')}
                  className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Technician {renderSortIcon('technician')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('payment_status')}
                  className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Payment {renderSortIcon('payment_status')}
                  </div>
                </th>
                {hasAnyAction && (
                  <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredReports.length > 0 ? (
                sortedAndFilteredReports.map((report) => {
                  const statusConfig = getStatusConfig(report.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-accent transition-colors cursor-pointer"
                      onDoubleClick={() => handleRowDoubleClick(report)}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground font-medium font-mono">
                            {report.sample_id_code}
                          </span>
                          {report.status === 'rejected' && report.rejection_reason && (
                            <span title={report.rejection_reason}>
                              <AlertCircle
                                className="w-3.5 h-3.5"
                                style={{ color: 'var(--destructive)' }}
                              />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="text-sm text-foreground">
                          {getPatientName(report)}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-xs text-foreground font-medium">
                          {getDoctorName(report)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-xs text-foreground">
                          {getTestCodes(report)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
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
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-xs text-foreground">
                          {getTechnicianName(report)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
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
                        <td className="px-3 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit/Enter Results - for draft or rejected reports */}
                            {isEditable(report) && canEdit && (
                              <Link
                                to={`/app/reports/${report.id}/entry`}
                                className="h-7 w-7 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                                title={report.status === 'rejected' ? 'Revise' : 'Enter Results'}
                              >
                                <PenLine className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Edit - for admin and technician on any status */}
                            {canEdit && !isEditable(report) && (
                              <Link
                                to={`/app/reports/${report.id}/entry?edit=true`}
                                className="h-7 w-7 flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                title="Edit Report"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Submit for Review - for draft reports with test data */}
                            {/* {report.status === 'draft' && report.test_data && canEdit && (
                              <button
                                onClick={() => handleSubmitForReview(report)}
                                className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                                title={isReportReadyForSubmit(report) ? 'Submit for Review' : 'Fill all required values first'}
                                disabled={(isActionLoading && actionId === report.id) || !isReportReadyForSubmit(report)}
                              >
                                {isActionLoading && actionId === report.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )} */}

                            {/* View - for under_review or approved reports */}
                            {(report.status === 'under_review' || report.status === 'approved') && (
                              <Link
                                to={`/app/reports/preview/${report.id}`}
                                className="h-7 w-7 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                                title="View Report"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Share - for approved reports (opens preview with share modal) */}
                            {report.status === 'approved' && (
                              <Link
                                to={`/app/reports/preview/${report.id}?share=1`}
                                className="h-7 w-7 flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400"
                                title="Share Report"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </Link>
                            )}

                             {/* Payment / Receipt Option Button */}
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setBillingAction({ reportId: report.id, type: 'option' });
                               }}
                               className="h-7 w-7 flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 cursor-pointer transition-colors dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                               title="Payment & Receipts"
                             >
                               <IndianRupee className="w-3.5 h-3.5" />
                             </button>

                            {/* Delete - admin only */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteReport(report)}
                                className="h-7 w-7 flex items-center justify-center bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 cursor-pointer transition-colors dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
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
                  <td colSpan={hasAnyAction ? 9 : 8} className="px-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? (
                        'Loading reports...'
                      ) : dateFilter ? (
                        (() => {
                          const [y, m, d] = dateFilter.split('-').map(Number);
                          const localDate = new Date(y, m - 1, d);
                          return `No reports found for ${localDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
                        })()
                      ) : (
                        'No reports found matching your filters'
                      )}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {billingAction?.type === 'bill' && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setBillingAction(null)}
          reportId={billingAction.reportId}
          onBillingUpdated={refreshReportsData}
        />
      )}

      {/* Receipt Modal */}
      {billingAction?.type === 'receipt' && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setBillingAction(null)}
          reportId={billingAction.reportId}
        />
      )}

      {/* Billing Option Selection Modal */}
      {billingAction?.type === 'option' && (() => {
        const report = reports.find(r => r.id === billingAction.reportId);
        return (
          <BillingOptionModal
            isOpen={true}
            onClose={() => setBillingAction(null)}
            patientName={report?.patient_name}
            sampleCode={report?.sample_id_code}
            onSelect={(option) => {
              setBillingAction({
                reportId: billingAction.reportId,
                type: option === 'bill' ? 'bill' : 'receipt',
              });
            }}
          />
        );
      })()}

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
