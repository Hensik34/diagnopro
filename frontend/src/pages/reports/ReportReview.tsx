import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Microscope,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import type { Report } from '../../types';
import { toast } from 'sonner';

/**
 * ReportReview Page - For authorized users to review and approve/reject reports
 * Requires 'report:review' permission
 */
export function ReportReview() {
  // Store
  const { 
    reports,
    fetchReports, 
    approveReport, 
    rejectReport,
    isLoading, 
    isActionLoading,
    actionId,
    error,
    clearError 
  } = useReportStore();
  const { user } = useAuthStore();

  // Filter for under_review reports using useMemo to prevent infinite loops
  const underReviewReports = useMemo(
    () => reports.filter((r) => r.status === 'under_review'),
    [reports]
  );

  // UI State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports({ status: 'under_review' });
  }, [fetchReports]);

  /**
   * Handle approve action
   */
  const handleApprove = async (reportId: string) => {
    const result = await approveReport(reportId);
    if (result) {
      toast.success('Report approved successfully!');
      
      // Check WhatsApp delivery details
      const delivery = result.whatsapp_delivery;
      if (delivery) {
        const warnings: string[] = [];
        
        if (delivery.patient && !delivery.patient.sent && !delivery.patient.skipped) {
          warnings.push(`Patient: ${delivery.patient.reason || 'Failed'}`);
        }
        if (delivery.doctor && !delivery.doctor.sent && !delivery.doctor.skipped) {
          warnings.push(`Doctor: ${delivery.doctor.reason || 'Failed'}`);
        }
        
        if (warnings.length > 0) {
          toast.warning(`WhatsApp auto-send issues: ${warnings.join('; ')}`, {
            duration: 6000
          });
        } else if (
          (delivery.patient && delivery.patient.sent) ||
          (delivery.doctor && delivery.doctor.sent)
        ) {
          toast.success('WhatsApp notifications sent successfully!');
        }
      }

      // Remove from list by refreshing
      fetchReports({ status: 'under_review' });
    }
  };

  /**
   * Handle reject action
   */
  const handleReject = async () => {
    if (!selectedReport) return;
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const result = await rejectReport(selectedReport.id, rejectReason);
    if (result) {
      setShowRejectModal(false);
      setSelectedReport(null);
      setRejectReason('');
      fetchReports({ status: 'under_review' });
    }
  };

  /**
   * Open reject modal
   */
  const openRejectModal = (report: Report) => {
    setSelectedReport(report);
    setRejectReason('');
    setShowRejectModal(true);
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
    return 'Unassigned';
  };

  /**
   * Loading state
   */
  if (isLoading && underReviewReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reports for review...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-0.5">Report Review</h1>
          <p className="text-muted-foreground text-xs">
            Review and approve or reject submitted reports
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={() => fetchReports({ status: 'under_review' })}
            className="h-8 px-3 flex items-center justify-center gap-1.5 rounded text-xs bg-secondary border border-border hover:bg-accent transition-colors flex-1 sm:flex-none cursor-pointer"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Pending Review</span>
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              {underReviewReports.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Awaiting approval</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Approved Today</span>
            <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              -
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Successfully processed</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">Rejected Today</span>
            <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mb-2">
            <span className="text-foreground text-2xl tracking-tight tabular-nums font-semibold">
              -
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Requires revision</span>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="text-sm text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports Awaiting Review ({underReviewReports.length})
          </h2>
        </div>

        {underReviewReports.length > 0 ? (
          <div className="divide-y divide-border">
            {underReviewReports.map((report) => (
              <div 
                key={report.id}
                className="p-2.5 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Report Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {report.report_type || 'General Test'}
                      </span>
                      <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                        Under Review
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mt-2">
                      {/* Patient */}
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <div>
                          <div className="text-foreground">{getPatientName(report)}</div>
                          <div className="text-[10px]">{report.patient_id?.slice(0, 8) || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Submitted */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <div>
                          <div className="text-foreground">
                            {report.submitted_at 
                              ? format(new Date(report.submitted_at), 'MMM d, yyyy')
                              : report.created_at 
                                ? format(new Date(report.created_at), 'MMM d, yyyy')
                                : 'N/A'}
                          </div>
                          <div className="text-[10px]">Submitted</div>
                        </div>
                      </div>
                      
                      {/* Technician */}
                      <div className="flex items-center gap-1.5">
                        <Microscope className="w-3.5 h-3.5" />
                        <div>
                          <div className="text-foreground">{getTechnicianName(report)}</div>
                          <div className="text-[10px]">Technician</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/reports/preview/${report.id}`}
                      className="h-8 px-3 flex items-center gap-1.5 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                    <button
                      onClick={() => openRejectModal(report)}
                      disabled={isActionLoading && actionId === report.id}
                      className="h-8 px-3 flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 text-destructive rounded hover:bg-destructive/20 transition-colors text-xs disabled:opacity-50"
                    >
                      {isActionLoading && actionId === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(report.id)}
                      disabled={isActionLoading && actionId === report.id}
                      className="h-8 px-3 flex items-center gap-1.5 bg-success text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50"
                    >
                      {isActionLoading && actionId === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No reports pending review
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All submitted reports have been reviewed
            </p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={user?.role === 'doctor' ? "/doctor-reports" : "/reports"}
          className="bg-card border border-border rounded p-3 hover:bg-accent/30 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-foreground">{user?.role === 'doctor' ? 'My Reports' : 'All Reports'}</div>
            <div className="text-xs text-muted-foreground">{user?.role === 'doctor' ? 'View your doctor report list' : 'View complete report list'}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Link
          to="/"
          className="bg-card border border-border rounded p-3 hover:bg-accent/30 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-foreground">Dashboard</div>
            <div className="text-xs text-muted-foreground">Return to dashboard</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Reject Report</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide a reason for rejecting this report
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Report Summary */}
              <div className="bg-secondary/50 rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Report Type</span>
                  <span className="text-foreground">{selectedReport.report_type || 'General Test'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="text-foreground">{getPatientName(selectedReport)}</span>
                </div>
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Rejection Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
                  rows={4}
                  placeholder="Please explain why this report is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              {/* Quick Reasons */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Quick Select
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Incomplete data',
                    'Abnormal values need verification',
                    'Patient information mismatch',
                    'Requires retest',
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className="px-2 py-1 text-[10px] bg-secondary border border-border rounded hover:bg-accent transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReport(null);
                  setRejectReason('');
                }}
                className="h-8 px-4 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || (isActionLoading && actionId === selectedReport.id)}
                className="h-8 px-4 bg-destructive text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isActionLoading && actionId === selectedReport.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
