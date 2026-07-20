import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { useReportStore } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { Loader2, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { formatAge } from '../../utils/age';

const C = {
  brand:      '#000000',
  brandLight: '#ffffff',
  text:       '#000000',
  secondary:  '#374151',
  muted:      '#6B7280',
  border:     '#d1d5db',
  tableBg:    '#ffffff',
} as const;

const printStyles = `
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .receipt-page-container {
    box-shadow: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    padding: 10mm 15mm !important;
    width: 210mm !important;
    height: 148.5mm !important;
    page-break-inside: avoid !important;
  }
}
`;

export function ReceiptPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const { selectedReport, fetchReportById, isLoading: reportLoading, error: reportError } = useReportStore();
  const { branches, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (reportId) {
      fetchReportById(reportId);
      fetchBranches();
    }
  }, [reportId, fetchReportById, fetchBranches]);

  const report = useMemo(() => selectedReport?.id === reportId ? selectedReport : null, [selectedReport, reportId]);
  const branch = useMemo(() => branches.find(b => b.id === (report as any)?.branch_id) || branches[0], [branches, report]);

  const testsParam = searchParams.get('tests') || report?.report_type || 'No tests selected';
  const amountParam = searchParams.get('amount') || String(report?.final_amount || 0);

  const receiptNumber = report ? `RCP-${report.id.slice(0, 8).toUpperCase()}` : '';
  const receiptDate = report ? format(new Date(report.created_at), 'dd/MM/yyyy') : '';

  if (reportLoading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-slate-700 dark:text-slate-300">{reportError}</p>
          <Link to="/app/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500">Report not found</p>
          <Link to="/app/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white/95 border-b border-slate-200">
        <div className="max-w-[1000px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/app/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Portrait Receipt Area */}
      <div className="print:bg-white" style={{ backgroundColor: '#F3F4F6', minHeight: 'calc(100vh - 48px)', paddingTop: '24px', paddingBottom: '24px' }}>
        <div
          className="receipt-page-container bg-white mx-auto print:my-0"
          style={{
            width: '210mm',
            height: '148.5mm',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: C.text,
            padding: '10mm 15mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* Main Top Content */}
          <div className="space-y-4">
            {/* Header: Logo/Info Left & Title/ID Right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${C.brand}`, paddingBottom: 10 }}>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '-0.02em' }}>
                  {branch?.name}
                </h1>
                <p style={{ fontSize: 10, color: C.secondary, margin: '2px 0 0', lineHeight: 1.3 }}>
                  {branch?.location}{branch?.city ? `, ${branch.city}` : ''}{branch?.phone ? ` | Phone: ${branch.phone}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '0.04em' }}>RECEIPT</h2>
                <p style={{ fontSize: 9, color: C.secondary, margin: '2px 0 0', fontFamily: 'monospace' }}>
                  {receiptNumber} | {receiptDate}
                </p>
              </div>
            </div>

            {/* Patient Information Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, lineHeight: 1.5, backgroundColor: C.tableBg, padding: '8px 12px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
              <div>
                <span style={{ color: C.secondary, fontWeight: 500 }}>Patient: </span>
                <span style={{ fontWeight: 600, color: C.text }}>{report.patient_name || 'Patient'}</span>
                <span style={{ margin: '0 6px', color: C.muted }}>|</span>
                <span style={{ color: C.secondary }}>Age/Sex: </span>
                <span style={{ fontWeight: 500 }}>{formatAge(report.patient_age, report.patient_age_unit)} / {report.patient_gender || 'N/A'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: C.secondary, fontWeight: 500 }}>Sample ID: </span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{report.sample_id_code || 'N/A'}</span>
              </div>
            </div>

            {/* Inline Row-wise Test List */}
            <div>
              <p style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 700 }}>
                Investigations / Services
              </p>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  minHeight: '36px',
                }}
              >
                {testsParam.split(',').map(t => t.trim()).filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          {/* Bottom Total & Disclaimer Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.3 }}>
              <p style={{ margin: 0 }}>* This is a computer-generated receipt and does not require a physical signature.</p>
              <p style={{ margin: '2px 0 0' }}>Thank you for choosing {branch?.name}.</p>
            </div>
            
            {/* Custom Amount Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `2px solid ${C.brand}`, borderRadius: '6px', padding: '6px 16px', backgroundColor: C.brandLight }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Paid
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.brand, fontFamily: 'monospace' }}>
                ₹{Number(amountParam).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

