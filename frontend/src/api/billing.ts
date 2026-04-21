import api from './client';
import type {
  ApiResponse,
  Payment,
  PaymentsResponse,
  BillingData,
  Report,
} from '../types';

// ==========================================
// Billing & Payment API Endpoints
// ==========================================

export const billingApi = {
  /**
   * Get all payments for a report
   */
  getPayments: async (reportId: string): Promise<{ message: string; data: PaymentsResponse }> => {
    const response = await api.get<{ message: string; data: PaymentsResponse }>(`/reports/${reportId}/payments`);
    return response.data;
  },

  /**
   * Add a payment to a report
   */
  addPayment: async (reportId: string, payment_mode: string, amount: number): Promise<{ message: string; data: { payment: Payment; totalPaid: number; finalAmount: number; paymentStatus: string } }> => {
    const response = await api.post(`/reports/${reportId}/payment`, { payment_mode, amount });
    return response.data;
  },

  /**
   * Delete a payment
   */
  deletePayment: async (reportId: string, paymentId: string): Promise<{ message: string; data: { deleted: Payment; totalPaid: number; finalAmount: number; paymentStatus: string } }> => {
    const response = await api.delete(`/reports/${reportId}/payment/${paymentId}`);
    return response.data;
  },

  /**
   * Update billing info (discounts) and recalculate final amount
   */
  updateBilling: async (reportId: string, billing: Partial<BillingData>): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${reportId}/billing`, billing);
    return response.data;
  },
};
