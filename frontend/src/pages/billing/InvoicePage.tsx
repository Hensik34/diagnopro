import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, ArrowLeft, Printer, Download, Plus, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { useParams, Link } from 'react-router';
import { useReportStore } from '../../stores/reportStore';
import { useBranchStore } from '../../stores/branchStore';
import { billingApi } from '../../api/billing';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Payment, PaymentMode, PaymentStatus } from '../../types';

const C = {
  brand:      '#1E3A8A',
  brandLight: '#DBEAFE',
  text:       '#111827',
  secondary:  '#6B7280',
  muted:      '#9CA3AF',
  border:     '#E5E7EB',
  tableBg:    '#F9FAFB',
  success:    '#16A34A',
  warning:    '#D97706',
  danger:     '#DC2626',
} as const;

const printStyles = `
@media print {
  @page { size: A4; margin: 10mm 14mm; }
  html, body { margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .invoice-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
}
`;

const MODE_LABELS: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card' };
const STATUS_COLORS: Record<PaymentStatus, string> = { paid: C.success, partial: C.warning, pending: C.danger };
const STATUS_LABELS: Record<PaymentStatus, string> = { paid: 'PAID', partial: 'PARTIAL', pending: 'UNPAID' };

export function InvoicePage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { selectedReport, fetchReportById, isLoading: reportLoading, error: reportError } = useReportStore();
  const { branches, fetchBranches } = useBranchStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [billingLoading, setBillingLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [newPaymentMode, setNewPaymentMode] = useState<PaymentMode>('cash');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportId) {
      fetchReportById(reportId);
      fetchBranches();
      setBillingLoading(true);
      billingApi.getPayments(reportId).then((res) => {
        setPayments(res.data.payments);
        setTotalPaid(res.data.totalPaid);
        setPaymentStatus(res.data.paymentStatus);
      }).catch(() => {}).finally(() => setBillingLoading(false));
    }
  }, [reportId, fetchReportById, fetchBranches]);

  const report = useMemo(() => selectedReport?.id === reportId ? selectedReport : null, [selectedReport, reportId]);
  const branch = useMemo(() => branches.find(b => b.id === (report as any)?.branch_id) || branches[0], [branches, report]);

  const baseAmount = Number(report?.base_amount ?? report?.report_amount ?? 0);
  const labDiscountType = report?.lab_discount_type || 'percent';
  const labDiscountValue = Number(report?.lab_discount_value ?? 0);
  const doctorDiscount = Number(report?.doctor_discount ?? 0);
  const finalAmount = Number(report?.final_amount ?? 0);
  const labDiscountAmount = labDiscountType === 'percent' ? (baseAmount * labDiscountValue) / 100 : labDiscountValue;
  const balance = finalAmount - totalPaid;

  const invoiceNumber = report ? `INV-${report.id.slice(0, 8).toUpperCase()}` : '';
  const invoiceDate = report ? format(new Date(report.created_at), 'dd/MM/yyyy') : '';

  const generatePDF = useCallback(async (): Promise<File | null> => {
    const el = invoiceRef.current;
    if (!el) return null;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      let position = 0;
      let remainingHeight = imgHeight;
      while (remainingHeight > 0) {
        if (position > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, -position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
        position += pageHeight;
      }
      const fileName = `Invoice-${report?.patient_name?.replace(/\s+/g, '_') || 'Patient'}-${invoiceNumber}.pdf`;
      return new File([pdf.output('blob')], fileName, { type: 'application/pdf' });
    } catch { return null; } finally { setIsGeneratingPdf(false); }
  }, [report, invoiceNumber]);

  const handleDownloadPdf = useCallback(async () => {
    const file = await generatePDF();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }, [generatePDF]);

  const handleAddPayment = async () => {
    if (!reportId) return;
    const amount = parseFloat(newPaymentAmount);
    if (!amount || amount <= 0) return;
    setIsAddingPayment(true);
    try {
      const res = await billingApi.addPayment(reportId, newPaymentMode, amount);
      const { payment, totalPaid: newTotalPaid, paymentStatus: newStatus } = res.data;
      setPayments((prev) => [...prev, payment]);
      setTotalPaid(newTotalPaid);
      setPaymentStatus(newStatus as PaymentStatus);
      setNewPaymentAmount('');
    } catch (err) {
      console.error('Failed to add payment:', err);
    } finally {
      setIsAddingPayment(false);
    }
  };

  if ((reportLoading || billingLoading) && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-gray-700">{reportError}</p>
          <Link to="/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Report not found</p>
          <Link to="/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const testNames = report.report_type || 'Laboratory Test';

  return (
    <>
      <style>{printStyles}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-[850px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded text-white transition-colors"
              style={{ backgroundColor: C.brand }}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* A4 Invoice */}
      <div className="min-h-screen print:bg-white" style={{ backgroundColor: '#F3F4F6' }}>
        <div
          ref={invoiceRef}
          className="invoice-page bg-white mx-auto my-6 print:my-0"
          style={{ maxWidth: '794px', minHeight: '1123px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.text }}
        >
          <div style={{ padding: '40px 48px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: `2px solid ${C.brand}`, paddingBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '-0.02em' }}>
                  {branch?.name || 'DiagnoPro Diagnostics'}
                </h1>
                <p style={{ fontSize: 11, color: C.secondary, margin: '4px 0 0', lineHeight: 1.5 }}>
                  {branch?.location || 'Medical District'}{branch?.city ? `, ${branch.city}` : ''}<br />
                  {branch?.phone ? `Phone: ${branch.phone}` : ''}{branch?.email ? ` | ${branch.email}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '0.05em' }}>INVOICE</h2>
                <p style={{ fontSize: 11, color: C.secondary, margin: '4px 0 0' }}>
                  {invoiceNumber}<br />
                  Date: {invoiceDate}
                </p>
              </div>
            </div>

            {/* Patient / Bill To */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: 600 }}>Bill To</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{report.patient_name || 'Patient'}</p>
                <p style={{ fontSize: 11, color: C.secondary, margin: '2px 0 0' }}>
                  {report.patient_age ? `${report.patient_age}Y` : ''} {report.patient_gender || ''}{report.patient_phone ? ` | ${report.patient_phone}` : ''}
                </p>
                <p style={{ fontSize: 11, color: C.secondary, margin: '2px 0 0' }}>
                  Patient ID: {report.patient_id.slice(0, 8)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: 600 }}>Referring Doctor</p>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                  {report.doctor_name ? `${report.doctor_title || 'Dr'}. ${report.doctor_name}` : report.doctor_firstname ? `Dr. ${report.doctor_firstname} ${report.doctor_lastname}` : 'Self (Walk-in)'}
                </p>
                {report.sample_id_code && (
                  <p style={{ fontSize: 11, color: C.secondary, margin: '2px 0 0' }}>
                    Sample: {report.sample_id_code}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ backgroundColor: C.brand, color: 'white' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>#</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>Test / Service</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {testNames.split(',').map((name, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: i % 2 === 0 ? '#fff' : C.tableBg }}>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{name.trim()}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {i === 0 ? `₹${baseAmount.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <div style={{ width: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                  <span style={{ color: C.secondary }}>Subtotal</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{baseAmount.toFixed(2)}</span>
                </div>
                {labDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                    <span style={{ color: C.secondary }}>
                      Lab Discount {labDiscountType === 'percent' ? `(${labDiscountValue}%)` : ''}
                    </span>
                    <span style={{ color: C.success, fontVariantNumeric: 'tabular-nums' }}>-₹{labDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {doctorDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                    <span style={{ color: C.secondary }}>Doctor Discount</span>
                    <span style={{ color: C.success, fontVariantNumeric: 'tabular-nums' }}>-₹{doctorDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 14, fontWeight: 700, borderTop: `2px solid ${C.brand}`, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            {payments.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 600 }}>Payment History</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.tableBg }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>#</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Date</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Mode</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 14px', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: '8px 14px', fontSize: 11 }}>{format(new Date(p.created_at), 'dd/MM/yyyy hh:mm a')}</td>
                        <td style={{ padding: '8px 14px', fontSize: 11 }}>{MODE_LABELS[p.payment_mode] || p.payment_mode}</td>
                        <td style={{ padding: '8px 14px', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Balance */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <div style={{ width: 300, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 12, backgroundColor: C.tableBg }}>
                  <span style={{ color: C.secondary }}>Total Paid</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>₹{totalPaid.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 12 }}>
                  <span style={{ color: C.secondary }}>Balance Due</span>
                  <span style={{ fontWeight: 600, color: balance > 0 ? C.danger : C.success, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 14px', fontSize: 12, fontWeight: 700, backgroundColor: STATUS_COLORS[paymentStatus], color: '#fff', letterSpacing: '0.06em' }}>
                  {STATUS_LABELS[paymentStatus]}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
                This is a computer-generated invoice and does not require a signature.
              </p>
              <p style={{ fontSize: 10, color: C.muted, margin: '4px 0 0' }}>
                {branch?.name || 'DiagnoPro Diagnostics'} — Thank you for choosing us.
              </p>
            </div>
          </div>
        </div>

        {/* Collect Payment Section (non-printable) */}
        {paymentStatus !== 'paid' && (
          <div
            className="no-print bg-white mx-auto mb-6 rounded-lg border border-gray-200"
            style={{ maxWidth: '794px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >
            <div style={{ padding: '20px 48px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Collect Payment</h3>
              <p style={{ fontSize: 11, color: C.secondary, margin: '0 0 16px' }}>
                Balance due: <span style={{ fontWeight: 600, color: C.danger }}>₹{balance.toFixed(2)}</span>
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    { value: 'cash' as PaymentMode, label: 'Cash', Icon: Banknote },
                    { value: 'upi' as PaymentMode, label: 'UPI', Icon: Smartphone },
                    { value: 'card' as PaymentMode, label: 'Card', Icon: CreditCard },
                  ]).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNewPaymentMode(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${newPaymentMode === value ? C.brand : C.border}`,
                        backgroundColor: newPaymentMode === value ? C.brandLight : '#fff',
                        color: newPaymentMode === value ? C.brand : C.secondary,
                      }}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.muted }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPayment(); }}
                    placeholder={balance.toFixed(2)}
                    style={{
                      width: '100%', height: 36, paddingLeft: 24, paddingRight: 10, borderRadius: 6,
                      border: `1px solid ${C.border}`, fontSize: 13, textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums', outline: 'none',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={isAddingPayment || !newPaymentAmount}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    backgroundColor: C.brand, color: '#fff', border: 'none', cursor: 'pointer',
                    opacity: (isAddingPayment || !newPaymentAmount) ? 0.5 : 1, height: 36,
                  }}
                >
                  {isAddingPayment ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 14, height: 14 }} />}
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
