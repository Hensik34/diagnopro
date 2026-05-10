import { api } from './client';
import type {
  B2BLab, CreateB2BLabData, B2BRate, B2BOrder, CreateB2BOrderData,
  B2BPayment, RecordB2BPaymentData, B2BLabLedger, B2BDashboardStats,
  B2BNotification, B2BAuditEntry, B2BReportVersion, B2BOrderFilters,
} from '../types/b2b';

const BASE = '/b2b';

// ==========================================
// LAB MANAGEMENT
// ==========================================

export const b2bApi = {
  // Labs
  createLab: async (data: CreateB2BLabData) => {
    const res = await api.post(`${BASE}/labs`, data);
    return res.data.data as B2BLab;
  },
  getLabs: async (ownerBranchId?: string) => {
    const params = ownerBranchId ? { owner_branch_id: ownerBranchId } : {};
    const res = await api.get(`${BASE}/labs`, { params });
    return res.data.data as B2BLab[];
  },
  getLabById: async (id: string) => {
    const res = await api.get(`${BASE}/labs/${id}`);
    return res.data.data as B2BLab;
  },
  updateLab: async (id: string, data: Partial<B2BLab>) => {
    const res = await api.put(`${BASE}/labs/${id}`, data);
    return res.data.data as B2BLab;
  },
  deleteLab: async (id: string) => {
    const res = await api.delete(`${BASE}/labs/${id}`);
    return res.data;
  },

  // Rate Lists
  getRateList: async (labId: string) => {
    const res = await api.get(`${BASE}/labs/${labId}/rates`);
    return res.data.data as B2BRate[];
  },
  upsertRate: async (labId: string, data: { test_id: string; collection_price: number; processing_price: number }) => {
    const res = await api.post(`${BASE}/labs/${labId}/rates`, data);
    return res.data.data as B2BRate;
  },
  bulkUpsertRates: async (labId: string, rates: { test_id: string; collection_price: number; processing_price: number }[]) => {
    const res = await api.put(`${BASE}/labs/${labId}/rates/bulk`, { rates });
    return res.data.data as B2BRate[];
  },
  deleteRate: async (labId: string, rateId: string) => {
    const res = await api.delete(`${BASE}/labs/${labId}/rates/${rateId}`);
    return res.data;
  },

  // Orders
  createOrder: async (data: CreateB2BOrderData) => {
    const res = await api.post(`${BASE}/orders`, data);
    return res.data.data as B2BOrder;
  },
  getOrders: async (filters?: B2BOrderFilters) => {
    const res = await api.get(`${BASE}/orders`, { params: filters });
    return res.data.data as B2BOrder[];
  },
  getOrderById: async (id: string) => {
    const res = await api.get(`${BASE}/orders/${id}`);
    return res.data.data as B2BOrder;
  },
  getOrderByBarcode: async (barcode: string) => {
    const res = await api.get(`${BASE}/orders/barcode/${barcode}`);
    return res.data.data as B2BOrder;
  },
  updateOrder: async (id: string, data: Partial<B2BOrder>) => {
    const res = await api.put(`${BASE}/orders/${id}`, data);
    return res.data.data as B2BOrder;
  },
  receiveOrder: async (id: string, receivedTime?: string) => {
    const res = await api.patch(`${BASE}/orders/${id}/receive`, { received_time: receivedTime });
    return res.data.data as B2BOrder;
  },
  cancelOrder: async (id: string, reason: string) => {
    const res = await api.patch(`${BASE}/orders/${id}/cancel`, { reason });
    return res.data.data as B2BOrder;
  },

  // Per-Test Status
  updateTestStatus: async (testId: string, status: string, data?: { rejection_reason?: string; report_id?: string }) => {
    const res = await api.patch(`${BASE}/order-tests/${testId}/status`, { status, ...data });
    return res.data.data;
  },

  // Report Versions
  uploadReportVersion: async (data: { order_test_id: string; report_id?: string; file_url?: string; report_data?: unknown; revision_reason?: string }) => {
    const res = await api.post(`${BASE}/reports/upload`, data);
    return res.data.data as B2BReportVersion;
  },
  getReportVersions: async (orderTestId: string) => {
    const res = await api.get(`${BASE}/reports/${orderTestId}/versions`);
    return res.data.data as B2BReportVersion[];
  },
  approveReport: async (versionId: string) => {
    const res = await api.patch(`${BASE}/reports/versions/${versionId}/approve`);
    return res.data.data as B2BReportVersion;
  },
  releaseReport: async (versionId: string) => {
    const res = await api.patch(`${BASE}/reports/versions/${versionId}/release`);
    return res.data.data as B2BReportVersion;
  },

  // Payments
  recordPayment: async (data: RecordB2BPaymentData) => {
    const res = await api.post(`${BASE}/payments`, data);
    return res.data.data as B2BPayment;
  },
  getPayments: async (labId: string, filters?: Record<string, string>) => {
    const res = await api.get(`${BASE}/payments/${labId}`, { params: filters });
    return res.data.data as B2BPayment[];
  },
  getLabLedger: async (labId: string) => {
    const res = await api.get(`${BASE}/ledger/${labId}`);
    return res.data.data as B2BLabLedger;
  },
  getSettlementSummary: async (ownerBranchId?: string) => {
    const params = ownerBranchId ? { owner_branch_id: ownerBranchId } : {};
    const res = await api.get(`${BASE}/settlements/summary`, { params });
    return res.data.data;
  },
  deletePayment: async (id: string) => {
    const res = await api.delete(`${BASE}/payments/${id}`);
    return res.data;
  },

  // Dashboard
  getDashboard: async (ownerBranchId?: string) => {
    const params: Record<string, string> = {};
    if (ownerBranchId) params.owner_branch_id = ownerBranchId;
    const res = await api.get(`${BASE}/dashboard`, { params });
    return res.data.data as B2BDashboardStats;
  },

  // Notifications
  getNotifications: async (filters?: Record<string, string | boolean>) => {
    const res = await api.get(`${BASE}/notifications`, { params: filters });
    return res.data.data as B2BNotification[];
  },
  markNotificationRead: async (id: string) => {
    const res = await api.patch(`${BASE}/notifications/${id}/read`);
    return res.data.data;
  },
  markAllRead: async () => {
    const res = await api.patch(`${BASE}/notifications/read-all`);
    return res.data;
  },

  // Audit Log
  getAuditLog: async (filters?: Record<string, string>) => {
    const res = await api.get(`${BASE}/audit`, { params: filters });
    return res.data.data as B2BAuditEntry[];
  },
};
