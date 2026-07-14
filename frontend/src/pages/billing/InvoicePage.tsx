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
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .invoice-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; padding: 16mm 20mm !important; width: 100% !important; max-width: none !important; }
  .invoice-content { padding: 0 !important; }
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

  const testNames = report.report_type || 'Laboratory Test';

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
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded text-white transition-colors cursor-pointer"
              style={{ backgroundColor: C.brand }}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* A4 Invoice */}
      <div className="print:bg-white" style={{ backgroundColor: '#F3F4F6', paddingTop: '24px', paddingBottom: '24px' }}>
        <div
          ref={invoiceRef}
          className="invoice-page bg-white mx-auto print:my-0"
          style={{ maxWidth: '794px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.text }}
        >
          <div className="invoice-content" style={{ padding: '28px 36px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: `2px solid ${C.brand}`, paddingBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '-0.02em' }}>
                  {branch?.name}
                </h1>
                <p style={{ fontSize: 11, color: C.secondary, margin: '3px 0 0', lineHeight: 1.4 }}>
                  {branch?.location}{branch?.city ? `, ${branch.city}` : ''}{branch?.phone ? ` | ${branch.phone}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: C.brand, margin: 0, letterSpacing: '0.05em' }}>INVOICE</h2>
                <p style={{ fontSize: 10, color: C.secondary, margin: '3px 0 0' }}>
                  {invoiceNumber} | {invoiceDate}
                </p>
              </div>
            </div>

            {/* Patient & Doctor Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 600 }}>Bill To</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{report.patient_name || 'Patient'}</p>
                <p style={{ fontSize: 10, color: C.secondary, margin: '1px 0 0' }}>
                  {formatAge(report.patient_age, report.patient_age_unit)} • {report.patient_gender || 'N/A'}{report.patient_phone ? ` • ${report.patient_phone}` : ''}
                </p>
                <p style={{ fontSize: 10, color: C.secondary, margin: '1px 0 0' }}>
                  ID: {report.patient_id.slice(0, 8)}
                </p>
              </div>
              <div style={{ textAlign: 'right', flex: 1 }}>
                <p style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 600 }}>Referring Doctor</p>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>
                  {report.doctor_name ? `${report.doctor_title || 'Dr'}. ${report.doctor_name}` : report.doctor_firstname ? `Dr. ${report.doctor_firstname} ${report.doctor_lastname}` : 'Self (Walk-in)'}
                </p>
                {report.sample_id_code && (
                  <p style={{ fontSize: 10, color: C.secondary, margin: '1px 0 0' }}>
                    Sample: {report.sample_id_code}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
              <thead>
                <tr style={{ backgroundColor: C.brand, color: 'white' }}>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>#</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600 }}>Test / Service</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600 }}>Amount (₹)</th>
                </tr>
              </thead>
               <tbody>
                {report.pricing_snapshot && report.pricing_snapshot.length > 0 ? (
                  report.pricing_snapshot.map((item, i) => (
                    <tr key={item.id || i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: i % 2 === 0 ? '#fff' : C.tableBg }}>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{item.test_name || 'Unnamed Item'}</span>
                          <span style={{ fontSize: 9, color: C.secondary }}>
                            {item.package_id ? 'Package' : 'Test'} • {item.test_code || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{Number(item.applied_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  testNames.split(',').map((name, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: i % 2 === 0 ? '#fff' : C.tableBg }}>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{name.trim()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {i === 0 ? `₹${baseAmount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Payments */}
            {payments.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: 600 }}>Payment History</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.tableBg }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>#</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Date</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Mode</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 9, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 10px', fontSize: 10 }}>{i + 1}</td>
                        <td style={{ padding: '6px 10px', fontSize: 10 }}>{format(new Date(p.created_at), 'dd/MM/yyyy hh:mm a')}</td>
                        <td style={{ padding: '6px 10px', fontSize: 10 }}>{MODE_LABELS[p.payment_mode] || p.payment_mode}</td>
                        <td style={{ padding: '6px 10px', fontSize: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Consolidated Receipt Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
              <div style={{ width: 280, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                    <span style={{ color: C.secondary }}>Subtotal</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>₹{baseAmount.toFixed(2)}</span>
                  </div>
                  {labDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                      <span style={{ color: C.secondary }}>
                        Lab Discount {labDiscountType === 'percent' ? `(${labDiscountValue}%)` : ''}
                      </span>
                      <span style={{ color: C.success, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>−₹{labDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {doctorDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                      <span style={{ color: C.secondary }}>Doctor Discount</span>
                      <span style={{ color: C.success, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>−₹{doctorDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: `1px dashed ${C.border}`, margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, fontWeight: 700, color: C.brand }}>
                    <span>Total Amount</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{finalAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                    <span style={{ color: C.secondary }}>Total Paid</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>₹{totalPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: `1px dashed ${C.border}`, margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, fontWeight: 700 }}>
                    <span>Balance Due</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: balance > 0 ? C.danger : C.success }}>
                      ₹{balance.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 12px', fontSize: 11, fontWeight: 700, backgroundColor: STATUS_COLORS[paymentStatus], color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {STATUS_LABELS[paymentStatus]}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>
                Computer-generated invoice. No signature required.
              </p>
              <p style={{ fontSize: 9, color: C.muted, margin: '3px 0 0' }}>
                Thank you for your trust in {branch?.name}.
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
            <div style={{ padding: '16px 36px' }}>
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
                    backgroundColor: C.brand, color: '#fff', border: 'none', cursor: 'pointer',
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
