import { create } from 'zustand';
import { b2bApi } from '../api/b2b';
import type {
  B2BLab, CreateB2BLabData, B2BRate, B2BOrder, CreateB2BOrderData,
  B2BDashboardStats, B2BNotification, B2BPayment, RecordB2BPaymentData,
  B2BLabLedger, B2BOrderFilters, B2BAuditEntry, B2BReportVersion,
} from '../types/b2b';

// ==========================================
// B2B Store State
// ==========================================

interface B2BState {
  // Data
  labs: B2BLab[];
  selectedLab: B2BLab | null;
  rateList: B2BRate[];
  orders: B2BOrder[];
  selectedOrder: B2BOrder | null;
  dashboard: B2BDashboardStats | null;
  notifications: B2BNotification[];
  payments: B2BPayment[];
  ledger: B2BLabLedger | null;
  auditLog: B2BAuditEntry[];
  reportVersions: B2BReportVersion[];
  // UI
  isLoading: boolean;
  error: string | null;

  // Lab Actions
  fetchLabs: (ownerBranchId?: string) => Promise<void>;
  fetchLabById: (id: string) => Promise<void>;
  createLab: (data: CreateB2BLabData) => Promise<B2BLab>;
  updateLab: (id: string, data: Partial<B2BLab>) => Promise<void>;
  deleteLab: (id: string) => Promise<void>;

  // Rate Actions
  fetchRateList: (labId: string) => Promise<void>;
  upsertRate: (labId: string, data: { test_id: string; collection_price: number; processing_price: number }) => Promise<void>;
  bulkUpsertRates: (labId: string, rates: { test_id: string; collection_price: number; processing_price: number }[]) => Promise<void>;

  // Order Actions
  fetchOrders: (filters?: B2BOrderFilters) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (data: CreateB2BOrderData) => Promise<B2BOrder>;
  receiveOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  updateTestStatus: (testId: string, status: string, data?: Record<string, string>) => Promise<void>;

  // Report Version Actions
  fetchReportVersions: (orderTestId: string) => Promise<void>;
  uploadReportVersion: (data: { order_test_id: string; report_id?: string; file_url?: string; report_data?: unknown; revision_reason?: string }) => Promise<void>;
  approveReport: (versionId: string) => Promise<void>;
  releaseReport: (versionId: string) => Promise<void>;

  // Payment Actions
  fetchPayments: (labId: string, filters?: Record<string, string>) => Promise<void>;
  recordPayment: (data: RecordB2BPaymentData) => Promise<void>;
  fetchLedger: (labId: string) => Promise<void>;

  // Dashboard
  fetchDashboard: (ownerBranchId?: string) => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  // Audit
  fetchAuditLog: (filters?: Record<string, string>) => Promise<void>;

  clearError: () => void;
}

// ==========================================
// B2B Store Implementation
// ==========================================

export const useB2BStore = create<B2BState>((set, get) => ({
  labs: [],
  selectedLab: null,
  rateList: [],
  orders: [],
  selectedOrder: null,
  dashboard: null,
  notifications: [],
  payments: [],
  ledger: null,
  auditLog: [],
  reportVersions: [],
  isLoading: false,
  error: null,

  // ==========================================
  // LAB ACTIONS
  // ==========================================

  fetchLabs: async (ownerBranchId) => {
    set({ isLoading: true, error: null });
    try {
      const labs = await b2bApi.getLabs(ownerBranchId);
      set({ labs, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch labs' });
    }
  },

  fetchLabById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const lab = await b2bApi.getLabById(id);
      set({ selectedLab: lab, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch lab' });
    }
  },

  createLab: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const lab = await b2bApi.createLab(data);
      set((s) => ({ labs: [lab, ...s.labs], isLoading: false }));
      return lab;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create lab';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  updateLab: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const lab = await b2bApi.updateLab(id, data);
      set((s) => ({
        labs: s.labs.map((l) => (l.id === id ? lab : l)),
        selectedLab: s.selectedLab?.id === id ? lab : s.selectedLab,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to update lab' });
      throw err;
    }
  },

  deleteLab: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await b2bApi.deleteLab(id);
      set((s) => ({ labs: s.labs.filter((l) => l.id !== id), isLoading: false }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to delete lab' });
    }
  },

  // ==========================================
  // RATE ACTIONS
  // ==========================================

  fetchRateList: async (labId) => {
    set({ isLoading: true, error: null });
    try {
      const rateList = await b2bApi.getRateList(labId);
      set({ rateList, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch rates' });
    }
  },

  upsertRate: async (labId, data) => {
    try {
      await b2bApi.upsertRate(labId, data);
      await get().fetchRateList(labId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save rate' });
      throw err;
    }
  },

  bulkUpsertRates: async (labId, rates) => {
    set({ isLoading: true, error: null });
    try {
      await b2bApi.bulkUpsertRates(labId, rates);
      await get().fetchRateList(labId);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to save rates' });
      throw err;
    }
  },

  // ==========================================
  // ORDER ACTIONS
  // ==========================================

  fetchOrders: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await b2bApi.getOrders(filters);
      set({ orders, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch orders' });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const order = await b2bApi.getOrderById(id);
      set({ selectedOrder: order, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch order' });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const order = await b2bApi.createOrder(data);
      set((s) => ({ orders: [order, ...s.orders], isLoading: false }));
      return order;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create order';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  receiveOrder: async (id) => {
    try {
      await b2bApi.receiveOrder(id);
      await get().fetchOrderById(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to receive order' });
      throw err;
    }
  },

  cancelOrder: async (id, reason) => {
    try {
      await b2bApi.cancelOrder(id, reason);
      await get().fetchOrderById(id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel order' });
      throw err;
    }
  },

  updateTestStatus: async (testId, status, data) => {
    try {
      await b2bApi.updateTestStatus(testId, status, data);
      // Refresh selected order if loaded
      const order = get().selectedOrder;
      if (order) await get().fetchOrderById(order.id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update test status' });
      throw err;
    }
  },

  // ==========================================
  // REPORT VERSION ACTIONS
  // ==========================================

  fetchReportVersions: async (orderTestId) => {
    try {
      const reportVersions = await b2bApi.getReportVersions(orderTestId);
      set({ reportVersions });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch report versions' });
    }
  },

  uploadReportVersion: async (data) => {
    try {
      await b2bApi.uploadReportVersion(data);
      await get().fetchReportVersions(data.order_test_id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to upload report' });
      throw err;
    }
  },

  approveReport: async (versionId) => {
    try {
      await b2bApi.approveReport(versionId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to approve report' });
      throw err;
    }
  },

  releaseReport: async (versionId) => {
    try {
      await b2bApi.releaseReport(versionId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to release report' });
      throw err;
    }
  },

  // ==========================================
  // PAYMENT ACTIONS
  // ==========================================

  fetchPayments: async (labId, filters) => {
    set({ isLoading: true, error: null });
    try {
      const payments = await b2bApi.getPayments(labId, filters);
      set({ payments, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch payments' });
    }
  },

  recordPayment: async (data) => {
    try {
      await b2bApi.recordPayment(data);
      await get().fetchPayments(data.b2b_lab_id);
      await get().fetchLedger(data.b2b_lab_id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to record payment' });
      throw err;
    }
  },

  fetchLedger: async (labId) => {
    try {
      const ledger = await b2bApi.getLabLedger(labId);
      set({ ledger });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch ledger' });
    }
  },

  // ==========================================
  // DASHBOARD
  // ==========================================

  fetchDashboard: async (ownerBranchId) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await b2bApi.getDashboard(ownerBranchId);
      set({ dashboard, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch dashboard' });
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  fetchNotifications: async () => {
    try {
      const notifications = await b2bApi.getNotifications();
      set({ notifications });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch notifications' });
    }
  },

  markNotificationRead: async (id) => {
    try {
      await b2bApi.markNotificationRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed' });
    }
  },

  markAllRead: async () => {
    try {
      await b2bApi.markAllRead();
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, is_read: true })) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed' });
    }
  },

  // ==========================================
  // AUDIT
  // ==========================================

  fetchAuditLog: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const auditLog = await b2bApi.getAuditLog(filters);
      set({ auditLog, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch audit log' });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    labs: [],
    selectedLab: null,
    rateList: [],
    orders: [],
    selectedOrder: null,
    dashboard: null,
    notifications: [],
    payments: [],
    ledger: null,
    auditLog: [],
    reportVersions: [],
    isLoading: false,
    error: null,
  }),
}));

// ==========================================
// Selector Hooks
// ==========================================

export const useB2BLabs = () => useB2BStore((s) => s.labs);
export const useB2BSelectedLab = () => useB2BStore((s) => s.selectedLab);
export const useB2BOrders = () => useB2BStore((s) => s.orders);
export const useB2BSelectedOrder = () => useB2BStore((s) => s.selectedOrder);
export const useB2BDashboard = () => useB2BStore((s) => s.dashboard);
export const useB2BNotifications = () => useB2BStore((s) => s.notifications);
export const useB2BLoading = () => useB2BStore((s) => s.isLoading);
export const useB2BError = () => useB2BStore((s) => s.error);
export const useUnreadB2BNotifications = () => useB2BStore((s) => s.notifications.filter((n) => !n.is_read));
