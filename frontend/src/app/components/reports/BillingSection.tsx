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
import type { PaymentMode, PaymentStatus } from "../../../types";

interface BillingSectionProps {
  reportId: string | undefined;
  isEditable: boolean;
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

export function BillingSection({ reportId, isEditable }: BillingSectionProps) {
  const {
    baseAmount,
    labDiscountType,
    labDiscountValue,
    doctorDiscount,
    finalAmount,
    payments,
    paymentStatus,
    totalPaid,
    isLoading,
    setBaseAmount,
    setLabDiscount,
    setDoctorDiscount,
    addPayment,
    deletePayment,
    saveBilling,
    fetchPayments,
  } = useBillingStore();

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
    await saveBilling(reportId);
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
    }
    setIsAddingPayment(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!reportId) return;
    await deletePayment(reportId, paymentId);
  };

  // Always derive payment status from local values to avoid stale server status
  const derivedStatus: PaymentStatus =
    totalPaid >= finalAmount && finalAmount > 0 ? 'paid' :
    totalPaid > 0 ? 'partial' : 'pending';

  const statusConfig = STATUS_CONFIG[derivedStatus];
  const StatusIcon = statusConfig.icon;

  const balance = finalAmount - totalPaid;

  return (
    <div className="bg-card border border-border rounded">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <h3 className="text-foreground text-sm flex items-center gap-2">
          <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
          Payment Details
        </h3>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium"
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Base Amount */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            Base Amount
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full h-8 pl-7 pr-2.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
              value={baseAmount || ''}
              onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
              disabled={!isEditable}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Lab Discount */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            Lab Discount
          </label>
          <div className="flex gap-1.5">
            <select
              className="h-8 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              value={labDiscountType}
              onChange={(e) => setLabDiscount(e.target.value as 'percent' | 'amount', labDiscountValue)}
              disabled={!isEditable}
            >
              <option value="percent">%</option>
              <option value="amount">₹</option>
            </select>
            <div className="relative flex-1">
              {labDiscountType === 'percent' ? (
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              ) : (
                <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              )}
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full h-8 pl-7 pr-2.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
                value={labDiscountValue || ''}
                onChange={(e) => setLabDiscount(labDiscountType, parseFloat(e.target.value) || 0)}
                disabled={!isEditable}
                placeholder="0"
              />
            </div>
          </div>
          {labDiscountType === 'percent' && labDiscountValue > 0 && baseAmount > 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
              = ₹{((baseAmount * labDiscountValue) / 100).toFixed(2)} off
            </div>
          )}
        </div>

        {/* Doctor Discount */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            Doctor Discount
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full h-8 pl-7 pr-2.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
              value={doctorDiscount || ''}
              onChange={(e) => setDoctorDiscount(parseFloat(e.target.value) || 0)}
              disabled={!isEditable}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Save Billing Button */}
        {isEditable && (
          <button
            onClick={handleSaveBilling}
            disabled={isSavingBilling || !reportId}
            className="w-full h-8 flex items-center justify-center gap-1.5 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs disabled:opacity-50"
          >
            {isSavingBilling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            Save Billing
          </button>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Final Amount */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-foreground">Final Amount</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            ₹{finalAmount.toFixed(2)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Payments List */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
            Payments
          </label>
          {payments.length > 0 ? (
            <div className="space-y-1.5">
              {payments.map((payment) => {
                const modeConfig = PAYMENT_MODES.find((m) => m.value === payment.payment_mode);
                const ModeIcon = modeConfig?.icon || Banknote;
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 border border-border rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ModeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="capitalize text-foreground">{payment.payment_mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-medium text-foreground">₹{parseFloat(String(payment.amount)).toFixed(2)}</span>
                      {isEditable && (
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                          title="Remove payment"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-[10px] text-muted-foreground">
              No payments recorded
            </div>
          )}
        </div>

        {/* Add Payment Form */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
            Add Payment
          </label>
          <div className="flex gap-1.5">
            <select
              className="h-8 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
              <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full h-8 pl-7 pr-2.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPayment();
                }}
              />
            </div>
            <button
              onClick={handleAddPayment}
              disabled={isAddingPayment || !newPaymentAmount || !reportId}
              className="h-8 w-8 flex items-center justify-center bg-primary text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              title="Add payment"
            >
              {isAddingPayment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Summary */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="tabular-nums text-foreground font-medium">₹{totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance</span>
            <span className={`tabular-nums font-medium ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
              ₹{balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
