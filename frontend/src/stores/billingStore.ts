import { create } from 'zustand';
import { billingApi } from '../api';
import type { Payment, PaymentMode, PaymentStatus, ReportTestPriceSnapshot } from '../types';

// ==========================================
// Billing Store State Interface
// ==========================================

interface BillingState {
  // State
  baseAmount: number;
  labDiscountType: 'percent' | 'amount';
  labDiscountValue: number;
  doctorDiscount: number;
  finalAmount: number;
  payments: Payment[];
  paymentStatus: PaymentStatus;
  totalPaid: number;
  pricingSnapshot: ReportTestPriceSnapshot[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setBaseAmount: (amount: number) => void;
  setLabDiscount: (type: 'percent' | 'amount', value: number) => void;
  setDoctorDiscount: (amount: number) => void;
  updateItemPrice: (itemId: string, price: number) => void;
  calculateFinalAmount: () => void;
  fetchPayments: (reportId: string) => Promise<void>;
  addPayment: (reportId: string, mode: PaymentMode, amount: number) => Promise<boolean>;
  deletePayment: (reportId: string, paymentId: string) => Promise<boolean>;
  saveBilling: (reportId: string) => Promise<boolean>;
  loadFromReport: (report: {
    base_amount?: number;
    lab_discount_type?: 'percent' | 'amount';
    lab_discount_value?: number;
    doctor_discount?: number;
    final_amount?: number;
    payment_status?: PaymentStatus;
    report_amount?: number;
    pricing_snapshot?: ReportTestPriceSnapshot[];
  }) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  baseAmount: 0,
  labDiscountType: 'percent' as const,
  labDiscountValue: 0,
  doctorDiscount: 0,
  finalAmount: 0,
  payments: [],
  paymentStatus: 'pending' as PaymentStatus,
  totalPaid: 0,
  pricingSnapshot: [] as ReportTestPriceSnapshot[],
  isLoading: false,
  error: null,
};

// ==========================================
// Helper: compute final amount
// ==========================================

function computeFinal(base: number, discType: 'percent' | 'amount', discValue: number, docDiscount: number): number {
  let labDiscount = 0;
  if (discType === 'percent') {
    labDiscount = (base * discValue) / 100;
  } else {
    labDiscount = discValue;
  }
  return Math.max(0, base - labDiscount - docDiscount);
}

// ==========================================
// Helper: derive payment status
// ==========================================

function derivePaymentStatus(totalPaid: number, finalAmount: number): PaymentStatus {
  if (totalPaid >= finalAmount && finalAmount > 0) return 'paid';
  if (totalPaid > 0) return 'partial';
  return 'pending';
}

// ==========================================
// Store Implementation
// ==========================================

export const useBillingStore = create<BillingState>((set, get) => ({
  ...initialState,

  setBaseAmount: (amount: number) => {
    set({ baseAmount: amount });
    get().calculateFinalAmount();
  },

  setLabDiscount: (type: 'percent' | 'amount', value: number) => {
    set({ labDiscountType: type, labDiscountValue: value });
    get().calculateFinalAmount();
  },

  setDoctorDiscount: (amount: number) => {
    set({ doctorDiscount: amount });
    get().calculateFinalAmount();
  },

  updateItemPrice: (itemId: string, price: number) => {
    const updatedSnapshot = get().pricingSnapshot.map(item => {
      const matchKey = item.test_id || item.package_id;
      if (matchKey === itemId) {
        return {
          ...item,
          applied_price: price,
          is_manual_override: true,
          source: 'manual' as const,
        };
      }
      return item;
    });
    const newBaseAmount = updatedSnapshot.reduce((sum, item) => sum + (Number(item.applied_price) || 0), 0);
    set({ pricingSnapshot: updatedSnapshot, baseAmount: newBaseAmount });
    get().calculateFinalAmount();
  },

  calculateFinalAmount: () => {
    const { baseAmount, labDiscountType, labDiscountValue, doctorDiscount, totalPaid } = get();
    const finalAmount = computeFinal(baseAmount, labDiscountType, labDiscountValue, doctorDiscount);
    const paymentStatus = derivePaymentStatus(totalPaid, finalAmount);
    set({ finalAmount, paymentStatus });
  },

  fetchPayments: async (reportId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await billingApi.getPayments(reportId);
      const { payments, totalPaid } = response.data;
      // Derive status from local finalAmount (which may include unsaved discounts)
      const { finalAmount } = get();
      const localFinal = finalAmount > 0 ? finalAmount : (response.data.finalAmount || 0);
      const paymentStatus = derivePaymentStatus(totalPaid, localFinal);
      set({
        payments,
        totalPaid,
        paymentStatus,
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch payments';
      set({ error: msg, isLoading: false });
    }
  },

  addPayment: async (reportId: string, mode: PaymentMode, amount: number): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await billingApi.addPayment(reportId, mode, amount);
      const { payment, totalPaid } = response.data;
      // Derive status from local finalAmount (includes unsaved discounts)
      const { finalAmount } = get();
      const paymentStatus = derivePaymentStatus(totalPaid, finalAmount);
      set((state) => ({
        payments: [...state.payments, payment],
        totalPaid,
        paymentStatus,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add payment';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  deletePayment: async (reportId: string, paymentId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await billingApi.deletePayment(reportId, paymentId);
      const { totalPaid } = response.data;
      // Derive status from local finalAmount (includes unsaved discounts)
      const { finalAmount } = get();
      const paymentStatus = derivePaymentStatus(totalPaid, finalAmount);
      set((state) => ({
        payments: state.payments.filter((p) => p.id !== paymentId),
        totalPaid,
        paymentStatus,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete payment';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  saveBilling: async (reportId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const { baseAmount, labDiscountType, labDiscountValue, doctorDiscount, pricingSnapshot } = get();
      const response = await billingApi.updateBilling(reportId, {
        base_amount: baseAmount,
        lab_discount_type: labDiscountType,
        lab_discount_value: labDiscountValue,
        doctor_discount: doctorDiscount,
        pricing_items: pricingSnapshot,
      });
      if (response.data) {
        const report = response.data;
        const newFinal = parseFloat(String(report.final_amount ?? 0));
        const newTotalPaid = parseFloat(String(report.total_paid ?? get().totalPaid ?? 0));
        const newSnapshot = report.pricing_snapshot || [];
        set({
          finalAmount: newFinal,
          totalPaid: newTotalPaid,
          paymentStatus: derivePaymentStatus(newTotalPaid, newFinal),
          pricingSnapshot: newSnapshot,
          isLoading: false,
        });
      }
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save billing';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  loadFromReport: (report) => {
    const base = parseFloat(String(report.base_amount ?? report.report_amount ?? 0));
    const discType = report.lab_discount_type || 'percent';
    const discValue = parseFloat(String(report.lab_discount_value ?? 0));
    const docDiscount = parseFloat(String(report.doctor_discount ?? 0));
    const final = parseFloat(String(report.final_amount ?? 0)) || computeFinal(base, discType, discValue, docDiscount);
    const snapshot = report.pricing_snapshot || [];

    set({
      baseAmount: base,
      labDiscountType: discType,
      labDiscountValue: discValue,
      doctorDiscount: docDiscount,
      finalAmount: final,
      paymentStatus: (report.payment_status as PaymentStatus) || 'pending',
      pricingSnapshot: snapshot,
    });
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
