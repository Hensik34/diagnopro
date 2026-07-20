import { useEffect, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle, Printer, X, Send, IndianRupee } from 'lucide-react';
import { useReportStore } from '../../../stores/reportStore';
import { BillingSection } from './BillingSection';
import { useBillingStore } from '../../../stores/billingStore';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  onBillingUpdated?: () => void | Promise<void>;
}

export function InvoiceModal({ isOpen, onClose, reportId, onBillingUpdated }: InvoiceModalProps) {
  const { selectedReport, fetchReportById, isLoading: reportLoading, error: reportError } = useReportStore();
  const { loadFromReport, reset: resetBilling } = useBillingStore();

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportById(reportId);
    }
    return () => {
      resetBilling();
    };
  }, [isOpen, reportId, fetchReportById]);

  // Load billing data when report arrives
  useEffect(() => {
    if (isOpen && selectedReport && selectedReport.id === reportId) {
      loadFromReport(selectedReport);
    }
  }, [isOpen, selectedReport, reportId, loadFromReport]);

  const report = useMemo(() => selectedReport?.id === reportId ? selectedReport : null, [selectedReport, reportId]);

  const handlePrint = useCallback(() => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.src = `/app/reports/${reportId}/invoice`;

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
          setTimeout(cleanup, 10000);
        } catch {
          cleanup();
          window.open(`/app/reports/${reportId}/invoice`, '_blank');
        }
      }, 400);
    };

    document.body.appendChild(iframe);
  }, [reportId]);

  const handleSendWhatsApp = useCallback(() => {
    if (!report) return;
    const phone = report.patient_phone || '';
    if (!phone) {
      alert('No patient phone number available for this report.');
      return;
    }
    const patientName = report.patient_name || 'Patient';
    const displayId = report.sample_id_code || report.id.slice(0, 8);
    const message = `Hello ${patientName},\n\nYour invoice (${displayId}) is ready.\nPlease contact us for any queries.\n\nThank you!`;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [report]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border rounded-t-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Payment Details
              {report?.sample_id_code && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  {report.sample_id_code}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Info */}
        {report && (
          <div className="px-4 py-2.5 bg-secondary/30 border-b border-border">
            <div className="text-xs text-foreground font-medium">{report.patient_name || 'Unknown Patient'}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {report.patient_phone && <span>{report.patient_phone}</span>}
              {report.report_type && <span className="ml-2">• {report.report_type}</span>}
            </div>
          </div>
        )}

        {/* Content */}
        {reportLoading && !report ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reportError ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-xs text-destructive">{reportError}</p>
            </div>
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-xs text-muted-foreground">Report not found</p>
          </div>
        ) : (
          <div className="p-4">
            {/* BillingSection — the same payment box from ReportEntry */}
            <BillingSection reportId={reportId} isEditable={true} isSelfReport={!!report?.is_self_report} onBillingUpdated={onBillingUpdated} />
          </div>
        )}

        {/* Footer Actions: Print + Send */}
        {report && (
          <div className="sticky bottom-0 bg-card border-t border-border rounded-b-xl px-4 py-3 flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 h-9 flex items-center justify-center gap-2 rounded border border-border bg-secondary hover:bg-accent transition-colors text-xs font-medium text-foreground"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex-1 h-9 flex items-center justify-center gap-2 rounded text-xs font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              <Send className="w-3.5 h-3.5" />
              Send WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
