import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useReportStore } from '../../../stores';
import type { ReportStatus, Report } from '../../../types';

/**
 * Report List Component
 * Demonstrates report store usage with status workflow
 */
export function ReportList() {
  const navigate = useNavigate();
  
  const { 
    reports, 
    isLoading, 
    error, 
    fetchReports,
    updateReportStatus,
    clearError 
  } = useReportStore();

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Status badge styling
  const getStatusBadge = (status: ReportStatus) => {
    const config: Record<ReportStatus, { bg: string; text: string; icon: typeof Clock }> = {
      created: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText },
      collected: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      processing: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
      completed: { bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle2 },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
    };

    const { bg, text, icon: Icon } = config[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get next status in workflow
  const getNextStatus = (currentStatus: ReportStatus): ReportStatus | null => {
    const workflow: Record<ReportStatus, ReportStatus | null> = {
      created: 'collected',
      collected: 'processing',
      processing: 'completed',
      completed: 'approved',
      approved: null,
    };
    return workflow[currentStatus];
  };

  const handleStatusUpdate = async (reportId: string, currentStatus: ReportStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      await updateReportStatus(reportId, nextStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Reports</h1>
          <p className="text-muted-foreground text-xs">
            Manage lab reports and workflow status
          </p>
        </div>
        <button 
          onClick={() => navigate('/reports/new')}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Report
        </button>
      </div>

      {/* Status Workflow Info */}
      <div className="bg-muted/30 border border-border rounded p-3">
        <p className="text-xs text-muted-foreground mb-2">Report Status Workflow:</p>
        <div className="flex items-center gap-2 text-xs">
          {(['created', 'collected', 'processing', 'completed', 'approved'] as ReportStatus[]).map((status, idx, arr) => (
            <span key={status} className="flex items-center gap-2">
              {getStatusBadge(status)}
              {idx < arr.length - 1 && <span className="text-muted-foreground">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Report Cards */}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm bg-card border border-border rounded">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm bg-card border border-border rounded">
            No reports found. Create a new report to get started.
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-card border border-border rounded p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {report.patient_name || 'Unknown Patient'}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.report_type || 'Lab Report'} • Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                  {report.technician_firstname && (
                    <p className="text-xs text-muted-foreground">
                      Technician: {report.technician_firstname} {report.technician_lastname}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Advance Status Button */}
                  {getNextStatus(report.status) && (
                    <button
                      onClick={() => handleStatusUpdate(report.id, report.status)}
                      className="h-7 px-2.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                    >
                      Mark as {getNextStatus(report.status)}
                    </button>
                  )}
                  
                  {/* View/Edit Button */}
                  <button
                    onClick={() => navigate(`/reports/${report.id}/entry`)}
                    className="h-7 px-2.5 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/80 transition-colors"
                  >
                    {report.status === 'approved' ? 'View' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
