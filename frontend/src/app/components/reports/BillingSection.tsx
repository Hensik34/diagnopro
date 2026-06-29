import { useState, useEffect } from "react";
import {
  IndianRupee,
  Percent,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useBillingStore } from "../../../stores/billingStore";
import { useReportStore } from "../../../stores/reportStore";
import type { PaymentMode, PaymentStatus } from "../../../types";

interface BillingSectionProps {
  reportId: string | undefined;
  isEditable: boolean;
  isSelfReport?: boolean;
  onBillingUpdated?: () => void | Promise<void>;
}

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
];

const STATUS_CONFIG: Record<PaymentStatus, { bg: string; text: string; label: string; icon: typeof CheckCircle }> = {
  paid: { bg: 'var(--success)', text: 'var(--success-foreground)', label: 'Paid', icon: CheckCircle },
  partial: { bg: 'var(--warning)', text: 'var(--warning-foreground)', label: 'Partial', icon: Clock },
  pending: { bg: 'var(--muted)', text: 'var(--muted-foreground)', label: 'Pending', icon: AlertCircle },
};

export function BillingSection({ reportId, isEditable, isSelfReport = false, onBillingUpdated }: BillingSectionProps) {
  const {
    baseAmount,
    labDiscountType,
    labDiscountValue,
    doctorDiscount,
    finalAmount,
    payments,
    paymentStatus,
    totalPaid,
    pricingSnapshot,
    isLoading,
    setBaseAmount,
    setLabDiscount,
    setDoctorDiscount,
    updateItemPrice,
    addPayment,
    deletePayment,
    saveBilling,
    fetchPayments,
  } = useBillingStore();
  const { selectedReport } = useReportStore();
  const report = selectedReport?.id === reportId ? selectedReport : null;

  // Local state for new payment form
  const [newPaymentMode, setNewPaymentMode] = useState<PaymentMode>('cash');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // Fetch payments when reportId is available
  useEffect(() => {
    if (reportId) {
      fetchPayments(reportId);
    }
  }, [reportId, fetchPayments]);

  const handleSaveBilling = async () => {
    if (!reportId) return;
    setIsSavingBilling(true);
    const success = await saveBilling(reportId);
    if (success) {
      await onBillingUpdated?.();
    }
    setIsSavingBilling(false);
  };

  const handleAddPayment = async () => {
    if (!reportId) return;
    const amount = parseFloat(newPaymentAmount);
    if (!amount || amount <= 0) return;

    setIsAddingPayment(true);
    const success = await addPayment(reportId, newPaymentMode, amount);
    if (success) {
      setNewPaymentAmount('');
      await onBillingUpdated?.();
    }
    setIsAddingPayment(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!reportId) return;
    const success = await deletePayment(reportId, paymentId);
    if (success) {
      await onBillingUpdated?.();
    }
  };

  // Always derive payment status from local values to avoid stale server status
  const derivedStatus: PaymentStatus =
    totalPaid >= finalAmount && finalAmount > 0 ? 'paid' :
    totalPaid > 0 ? 'partial' : 'pending';

  const statusConfig = STATUS_CONFIG[derivedStatus];
  const StatusIcon = statusConfig.icon;

  const balance = finalAmount - totalPaid;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      {/* Left Column: Detailed Items & Invoice Summary */}
      <div className="md:col-span-7 space-y-4">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-secondary/15 flex items-center justify-between">
            <h4 className="text-foreground text-sm font-semibold flex items-center gap-2">
              Items & Pricing Breakdown
            </h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="divide-y divide-border/60">
              {pricingSnapshot && pricingSnapshot.length > 0 ? (
                pricingSnapshot.map((item, idx) => {
                  const itemId = item.test_id || item.package_id;
                  return (
                    <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-foreground">
                          {item.test_name || item.package_name || 'Unnamed Item'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize">{item.package_id ? 'Package' : 'Test'}</span>
                          {item.test_code && <span>• {item.test_code}</span>}
                          {item.source && (
                            <span className="bg-secondary px-1 py-0.2 rounded-sm text-[8px] text-muted-foreground uppercase tracking-wide">
                              {item.source === 'default' ? 'Master Price' : item.source === 'manual' ? 'Manual Override' : `${item.source} list`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {isEditable && itemId ? (
                          <div className="relative flex items-center">
                            <span className="absolute left-1.5 text-[9px] text-muted-foreground">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-20 h-6 pl-4 pr-1 bg-background border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                              value={item.applied_price}
                              onChange={(e) => updateItemPrice(itemId, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ) : (
                          <div className="font-semibold text-foreground tabular-nums">
                            ₹{Number(item.applied_price || 0).toFixed(2)}
                          </div>
                        )}
                        {item.is_manual_override && (
                          <div className="text-[9px] text-muted-foreground line-through decoration-muted-foreground/60 tabular-nums">
                            ₹{Number(item.default_price || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground italic">
                  {report?.report_type ? (
                    <div className="space-y-1">
                      <p>Pricing snapshot not loaded yet.</p>
                      <p className="text-[10px] font-mono text-muted-foreground bg-secondary/20 p-2 rounded">
                        {report.report_type}
                      </p>
                    </div>
                  ) : (
                    'No tests assigned to this report.'
                  )}
                </div>
              )}
            </div>

            {/* Subtotal & Discount Breakdown */}
            <div className="border-t border-border pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Base Price)</span>
                <span className="tabular-nums text-foreground font-medium">₹{baseAmount.toFixed(2)}</span>
              </div>
              
              {/* Lab Discount */}
              {labDiscountValue > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Lab Discount {labDiscountType === 'percent' ? `(${labDiscountValue}%)` : ''}</span>
                  <span className="tabular-nums text-destructive font-medium">
                    -₹{((labDiscountType === 'percent' ? (baseAmount * labDiscountValue) / 100 : labDiscountValue)).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Doctor Discount */}
              {doctorDiscount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Doctor Discount</span>
                  <span className="tabular-nums text-destructive font-medium">-₹{doctorDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-border/80 my-2 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Final Net Amount</span>
                <span className="text-base font-bold text-foreground tabular-nums">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Settlement, Payments & Actions */}
      <div className="md:col-span-5 space-y-4">
        {/* Modify Billing & Discounts Form */}
        {isEditable && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Adjust Pricing & Discounts
            </h4>
            
            {/* Base Amount Input */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Base Amount Override
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums disabled:opacity-50"
                  value={baseAmount || ''}
                  onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Lab Discount Input */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Lab Discount
              </label>
              <div className="flex gap-1.5">
                <select
                  className="h-9 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={labDiscountType}
                  onChange={(e) => setLabDiscount(e.target.value as 'percent' | 'amount', labDiscountValue)}
                >
                  <option value="percent">% (Percent)</option>
                  <option value="amount">₹ (Amount)</option>
                </select>
                <div className="relative flex-1">
                  {labDiscountType === 'percent' ? (
                    <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                    value={labDiscountValue || ''}
                    onChange={(e) => setLabDiscount(labDiscountType, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Doctor Discount Input */}
            {!isSelfReport && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Doctor Discount
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                    value={doctorDiscount || ''}
                    onChange={(e) => setDoctorDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Apply / Save Button */}
            <button
              onClick={handleSaveBilling}
              disabled={isSavingBilling || !reportId}
              className="w-full h-9 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white rounded font-medium transition-colors text-xs disabled:opacity-50"
            >
              {isSavingBilling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              Apply Billing Changes
            </button>
          </div>
        )}

        {/* Settlement / Payments status */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Payments & Settlement
            </h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>

          {/* Payments List */}
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">
              Recorded Payments
            </label>
            {payments.length > 0 ? (
              <div className="space-y-1.5 max-h-[120px] overflow-auto">
                {payments.map((payment) => {
                  const modeConfig = PAYMENT_MODES.find((m) => m.value === payment.payment_mode);
                  const ModeIcon = modeConfig?.icon || Banknote;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/30 border border-border rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ModeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="capitalize text-foreground font-medium">{payment.payment_mode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold text-foreground">
                          ₹{parseFloat(String(payment.amount)).toFixed(2)}
                        </span>
                        {isEditable && (
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                            title="Remove payment"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-3 bg-secondary/10 border border-dashed border-border rounded text-xs text-muted-foreground">
                No payments recorded yet.
              </div>
            )}
          </div>

          {/* Add Payment Form */}
          {derivedStatus !== 'paid' && (
            <div className="border-t border-border/40 pt-3 space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Record New Payment
              </label>
              <div className="flex gap-1.5">
                <select
                  className="h-9 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newPaymentMode}
                  onChange={(e) => setNewPaymentMode(e.target.value as PaymentMode)}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddPayment();
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleAddPayment}
                disabled={isAddingPayment || !newPaymentAmount || !reportId}
                className="w-full h-9 flex items-center justify-center gap-1.5 bg-secondary border border-border hover:bg-accent hover:text-foreground text-foreground rounded font-medium transition-colors text-xs disabled:opacity-50"
              >
                {isAddingPayment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Record & Add Payment
                  </>
                )}
              </button>
            </div>
          )}

          {/* Settlement summary */}
          <div className="border-t border-border/60 pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="tabular-nums text-foreground font-semibold">₹{totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Due</span>
              <span className={`tabular-nums font-bold text-sm ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
