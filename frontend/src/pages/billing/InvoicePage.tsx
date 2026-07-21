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
import { formatAge } from '../../utils/age';


const C = {
  brand:      '#000000',
  brandLight: '#ffffff',
  text:       '#000000',
  secondary:  '#374151',
  muted:      '#6B7280',
  border:     '#d1d5db',
  tableBg:    '#ffffff',
  success:    '#000000',
  warning:    '#000000',
  danger:     '#000000',
} as const;

const printStyles = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  html, body, #root, .min-h-screen, .bg-background {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    height: auto !important;
    min-height: auto !important;
  }
  header, nav, aside, .no-print, [class*="Sidebar"], [class*="TopNav"] {
    display: none !important;
  }
  main {
    margin: 0 !important;
    padding: 0 !important;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .invoice-wrapper {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
  }
  .invoice-page {
    box-shadow: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    padding: 10mm !important;
    width: 148.5mm !important;
    height: 200mm !important;
    float: left !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
  }
  .invoice-content { padding: 0 !important; }
}
`;

const MODE_LABELS: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card' };
const STATUS_COLORS: Record<PaymentStatus, string> = { paid: '#000000', partial: '#4b5563', pending: '#000000' };
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
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 148.5, 210);
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

  const testNames = report?.report_type || 'Laboratory Test';

  // Dynamic Compact Sizing Configuration
  const testCount = useMemo(() => {
    if (!report) return 1;
    return report.pricing_snapshot?.length || testNames.split(',').length || 1;
  }, [report, testNames]);

  const isCompact = testCount > 8;

  const tableFontSize = isCompact ? '9px' : '10.5px';
  const tablePadding = isCompact ? '3.5px 6px' : '7px 10px';
  const sectionGap = isCompact ? '10px' : '20px';
  const headerPaddingBottom = isCompact ? '10px' : '16px';
  const headerMarginBottom = isCompact ? '12px' : '20px';

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
          <Link to="/app/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
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
          <Link to="/app/reports" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
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
      <div className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-[794px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/app/reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded text-white bg-black hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* A4 Landscape wrapper - Invoice on Left Half */}
      <div className="invoice-wrapper print:bg-white" style={{ backgroundColor: '#F3F4F6', paddingTop: '24px', paddingBottom: '24px' }}>
        <div
          ref={invoiceRef}
          className="invoice-page bg-white mx-auto print:my-0"
          style={{
            width: '148.5mm',
            height: '200mm',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: C.text,
            padding: '10mm',
            boxSizing: 'border-box',
          }}
        >
          <div className="invoice-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 0 }}>
            {/* Top Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${C.brand}`, paddingBottom: headerPaddingBottom }}>
                <div>
                  <h1 style={{ fontSize: isCompact ? 16 : 20, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '-0.02em' }}>
                    {branch?.name}
                  </h1>
                  <p style={{ fontSize: isCompact ? 9 : 11, color: C.secondary, margin: '3px 0 0', lineHeight: 1.4 }}>
                    {branch?.location}{branch?.city ? `, ${branch.city}` : ''}{branch?.phone ? ` | ${branch.phone}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: isCompact ? 20 : 26, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '0.05em' }}>INVOICE</h2>
                  <p style={{ fontSize: isCompact ? 8.5 : 10, color: C.secondary, margin: '3px 0 0' }}>
                    {invoiceNumber} | {invoiceDate}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isCompact ? 4 : 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 600 }}>Bill To</p>
                  <p style={{ fontSize: isCompact ? 11 : 13, fontWeight: 600, margin: 0 }}>{report.patient_name || 'Patient'}</p>
                  <p style={{ fontSize: isCompact ? 9 : 10, color: C.secondary, margin: '1px 0 0' }}>
                    {formatAge(report.patient_age, report.patient_age_unit)} • {report.patient_gender || 'N/A'}{report.patient_phone ? ` • ${report.patient_phone}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <p style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 600 }}>Referring Doctor</p>
                  <p style={{ fontSize: isCompact ? 10.5 : 12, fontWeight: 500, margin: 0 }}>
                    {report.doctor_name ? `${report.doctor_title || 'Dr'}. ${report.doctor_name}` : report.doctor_firstname ? `Dr. ${report.doctor_firstname} ${report.doctor_lastname}` : 'Self (Walk-in)'}
                  </p>
                  {report.sample_id_code && (
                    <p style={{ fontSize: isCompact ? 9 : 10, color: C.secondary, margin: '1px 0 0' }}>
                      Sample ID: {report.sample_id_code}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Table Box Container (Middle Section) */}
            <div
              style={{
                border: '1px solid #000000',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                marginTop: isCompact ? '8px' : '14px',
                marginBottom: isCompact ? '8px' : '14px',
                minHeight: '0',
              }}
            >
              {/* Top aligned content: Tests list + Payments history */}
              <div>
                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      <th style={{ padding: tablePadding, textAlign: 'left', fontSize: isCompact ? 8.5 : 10, fontWeight: 700, borderBottom: '1px solid #000000', width: '30px' }}>#</th>
                      <th style={{ padding: tablePadding, textAlign: 'left', fontSize: isCompact ? 8.5 : 10, fontWeight: 700, borderBottom: '1px solid #000000' }}>Test / Service</th>
                      <th style={{ padding: tablePadding, textAlign: 'right', fontSize: isCompact ? 8.5 : 10, fontWeight: 700, borderBottom: '1px solid #000000', width: '90px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pricing_snapshot && report.pricing_snapshot.length > 0 ? (
                      report.pricing_snapshot.map((item, i) => (
                        <tr key={item.id || i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : C.tableBg }}>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, width: '30px' }}>{i + 1}</td>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize }}>
                            <span style={{ fontWeight: 500 }}>{item.test_name || 'Unnamed Item'}</span>
                          </td>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>
                            ₹{Number(item.applied_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      testNames.split(',').map((name, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : C.tableBg }}>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, width: '30px' }}>{i + 1}</td>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize }}>{name.trim()}</td>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>
                            {i === 0 ? `₹${baseAmount.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Payments */}
                {payments.length > 0 && (
                  <div style={{ marginTop: isCompact ? 4 : 8, padding: '0 8px' }}>
                    <p style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 600 }}>Payment History</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.border}` }}>
                      <thead>
                        <tr style={{ backgroundColor: C.tableBg }}>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: 8, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>#</th>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: 8, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Date</th>
                          <th style={{ padding: '3px 6px', textAlign: 'left', fontSize: 8, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Mode</th>
                          <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: 8, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '3px 6px', fontSize: 8.5 }}>{i + 1}</td>
                            <td style={{ padding: '3px 6px', fontSize: 8.5 }}>{format(new Date(p.created_at), 'dd/MM/yyyy')}</td>
                            <td style={{ padding: '3px 6px', fontSize: 8.5 }}>{MODE_LABELS[p.payment_mode] || p.payment_mode}</td>
                            <td style={{ padding: '3px 6px', fontSize: 8.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{Number(p.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom aligned content: Totals Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000000' }}>
                <tbody>
                  {/* Subtotal & Discounts Section */}
                  {(labDiscountAmount > 0 || doctorDiscount > 0) && (
                    <tr>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', color: C.secondary }}>Subtotal:</td>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>₹{baseAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {labDiscountAmount > 0 && (
                    <tr>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', color: C.secondary }}>Lab Discount {labDiscountType === 'percent' ? `(${labDiscountValue}%)` : ''}:</td>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>−₹{labDiscountAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {doctorDiscount > 0 && (
                    <tr>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', color: C.secondary }}>Doctor Discount:</td>
                      <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>−₹{doctorDiscount.toFixed(2)}</td>
                    </tr>
                  )}

                  {paymentStatus === 'paid' ? (
                    <tr style={{ borderTop: '1px solid #000000', fontWeight: 700, backgroundColor: '#f9fafb' }}>
                      <td style={{ padding: tablePadding, fontSize: isCompact ? '9px' : '11px', textAlign: 'right' }}>Total Paid (PAID):</td>
                      <td style={{ padding: tablePadding, fontSize: isCompact ? '9px' : '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>₹{finalAmount.toFixed(2)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr style={{ borderTop: '1px solid #000000' }}>
                        <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', color: C.secondary }}>Total Amount:</td>
                        <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>₹{finalAmount.toFixed(2)}</td>
                      </tr>
                      {totalPaid > 0 && (
                        <tr>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', color: C.secondary }}>Total Paid:</td>
                          <td style={{ padding: tablePadding, fontSize: tableFontSize, textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>₹{totalPaid.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid #000000', fontWeight: 700, backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: tablePadding, fontSize: isCompact ? '9px' : '11px', textAlign: 'right' }}>
                          Balance Due ({paymentStatus === 'partial' ? 'PARTIAL' : 'UNPAID'}):
                        </td>
                        <td style={{ padding: tablePadding, fontSize: isCompact ? '9px' : '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', width: '90px' }}>₹{balance.toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap, marginTop: '12px' }}>

              {/* Footer */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, textAlign: 'center' }}>
                <p style={{ fontSize: 8.5, color: C.muted, margin: 0 }}>
                  Computer-generated invoice. No signature required.
                </p>
                <p style={{ fontSize: 8.5, color: C.muted, margin: '2px 0 0' }}>
                  Thank you for your trust in {branch?.name}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Collect Payment Section (non-printable) */}
        {paymentStatus !== 'paid' && (
          <div
            className="no-print bg-white mx-auto mb-6 rounded-lg border border-gray-200"
            style={{ width: '148.5mm', marginTop: '16px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >
            <div style={{ padding: '16px 20px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 3px' }}>Collect Payment</h3>
              <p style={{ fontSize: 10, color: C.secondary, margin: '0 0 12px' }}>
                Balance due: <span style={{ fontWeight: 600, color: C.danger }}>₹{balance.toFixed(2)}</span>
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {([
                    { value: 'cash' as PaymentMode, label: 'Cash', Icon: Banknote },
                    { value: 'upi' as PaymentMode, label: 'UPI', Icon: Smartphone },
                    { value: 'card' as PaymentMode, label: 'Card', Icon: CreditCard },
                  ]).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNewPaymentMode(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '5px 11px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${newPaymentMode === value ? C.brand : C.border}`,
                        backgroundColor: newPaymentMode === value ? C.brandLight : '#fff',
                        color: newPaymentMode === value ? C.brand : C.secondary,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon style={{ width: 13, height: 13 }} />
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.muted }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPayment(); }}
                    placeholder={balance.toFixed(2)}
                    style={{
                      width: '100%', height: 34, paddingLeft: 22, paddingRight: 8, borderRadius: 4,
                      border: `1px solid ${C.border}`, fontSize: 12, textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums', outline: 'none',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={isAddingPayment || !newPaymentAmount}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 14px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    backgroundColor: '#000000', color: '#fff', border: 'none', cursor: 'pointer',
                    opacity: (isAddingPayment || !newPaymentAmount) ? 0.5 : 1, height: 34, transition: 'opacity 0.2s',
                  }}
                >
                  {isAddingPayment ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 13, height: 13 }} />}
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
