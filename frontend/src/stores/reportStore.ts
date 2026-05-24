import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { reportApi, type ReportsSummary } from '../api';
import type { 
  Report, 
  CreateReportData, 
  UpdateReportData, 
  ReportFilters, 
  ReportStatus 
} from '../types';

// ==========================================
// Report Store State Interface
// ==========================================

interface ReportState {
  // State
  reports: Report[];
  selectedReport: Report | null;
  isLoading: boolean; // For list fetching
  isActionLoading: boolean; // For mutations (approve/reject/submit)
  actionId: string | null; // ID of the report being mutated
  error: string | null;
  filters: ReportFilters;
  summary: ReportsSummary | null;

  // Actions
  fetchReports: (filters?: ReportFilters) => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  fetchReportsByPatient: (patientId: string) => Promise<void>;
  fetchSummary: (branchId?: string) => Promise<void>;
  createReport: (data: CreateReportData) => Promise<Report | null>;
  updateReport: (id: string, data: UpdateReportData) => Promise<Report | null>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<Report | null>;
  assignTechnician: (id: string, technicianId: string) => Promise<Report | null>;
  
  // Workflow Actions
  submitReport: (id: string) => Promise<Report | null>;
  approveReport: (id: string) => Promise<Report | null>;
  rejectReport: (id: string, reason: string) => Promise<Report | null>;
  reviseReport: (id: string) => Promise<Report | null>;
  
  deleteReport: (id: string) => Promise<boolean>;
  setSelectedReport: (report: Report | null) => void;
  setFilters: (filters: ReportFilters) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  reports: [],
  selectedReport: null,
  isLoading: false,
  isActionLoading: false,
  actionId: null,
  error: null,
  filters: {},
  summary: null,
};

// ==========================================
// Report Store Implementation
// ==========================================

export const useReportStore = create<ReportState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Fetch all reports with optional filters
   */
  fetchReports: async (filters?: ReportFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const appliedFilters = filters || get().filters;
      const response = await reportApi.getAll(appliedFilters);
      
      set({
        reports: response.data,
        filters: appliedFilters,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single report by ID
   */
  fetchReportById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await reportApi.getById(id);
      set({
        selectedReport: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch reports for a specific patient
   */
  fetchReportsByPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await reportApi.getByPatient(patientId);
      set({
        reports: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patient reports';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch reports summary (counts by status)
   */
  fetchSummary: async (branchId?: string) => {
    try {
      const response = await reportApi.getSummary(branchId);
      set({ summary: response.summary });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  },

  /**
   * Create new report (status: draft)
   */
  createReport: async (data: CreateReportData): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: 'new', error: null });
    
    try {
      const response = await reportApi.create(data);
      const newReport = response.data;
      
      // Add to local cache
      set((state) => ({
        reports: [newReport, ...state.reports],
        isActionLoading: false,
        actionId: null,
      }));
      
      return newReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Update report content (findings, recommendations, etc.)
   */
  updateReport: async (id: string, data: UpdateReportData): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.update(id, data);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Update report status (workflow: Created → Collected → Processing → Completed → Approved)
   */
  updateReportStatus: async (id: string, status: ReportStatus): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.updateStatus(id, status);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update report status';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Assign technician to report
   */
  assignTechnician: async (id: string, technicianId: string): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.assignTechnician(id, technicianId);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign technician';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  // ==========================================
  // WORKFLOW ACTIONS
  // ==========================================

  /**
   * Submit report for review (draft/rejected → under_review)
   */
  submitReport: async (id: string): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.submit(id);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Approve report (under_review → approved)
   */
  approveReport: async (id: string): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.approve(id);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Reject report (under_review → rejected)
   */
  rejectReport: async (id: string, reason: string): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.reject(id, reason);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Revise rejected report (rejected → draft)
   */
  reviseReport: async (id: string): Promise<Report | null> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      const response = await reportApi.revise(id);
      const updatedReport = response.data;
      
      // Update local cache
      set((state) => ({
        reports: state.reports.map((r) => 
          r.id === id ? updatedReport : r
        ),
        selectedReport: state.selectedReport?.id === id 
          ? updatedReport 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return updatedReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revise report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return null;
    }
  },

  /**
   * Delete report
   */
  deleteReport: async (id: string): Promise<boolean> => {
    set({ isActionLoading: true, actionId: id, error: null });
    
    try {
      await reportApi.delete(id);
      
      // Remove from local cache
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        selectedReport: state.selectedReport?.id === id 
          ? null 
          : state.selectedReport,
        isActionLoading: false,
        actionId: null,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete report';
      set({ error: errorMessage, isActionLoading: false, actionId: null });
      return false;
    }
  },

  /**
   * Set selected report (for detail view)
   */
  setSelectedReport: (report: Report | null) => {
    set({ selectedReport: report });
  },

  /**
   * Update filters
   */
  setFilters: (filters: ReportFilters) => {
    set({ filters });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ==========================================
// Selector Hooks for Performance
// ==========================================

export const useReports = () => useReportStore((state) => state.reports);
export const useSelectedReport = () => useReportStore((state) => state.selectedReport);
export const useReportLoading = () => useReportStore((state) => state.isLoading);
export const useReportActionLoading = () => useReportStore((state) => state.isActionLoading);
export const useReportActionId = () => useReportStore((state) => state.actionId);
export const useReportError = () => useReportStore((state) => state.error);
export const useReportSummary = () => useReportStore((state) => state.summary);

// Status-based selectors using useShallow to prevent infinite loops
// Note: For filtering, prefer using useMemo in components for better performance
export const useReportsByStatus = (status: ReportStatus) => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === status))
  );

// Workflow status selectors - use useShallow wrapper
export const useDraftReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === 'draft'))
  );

export const useUnderReviewReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === 'under_review'))
  );

export const useApprovedReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === 'approved'))
  );

export const useRejectedReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === 'rejected'))
  );

export const usePendingReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => 
      r.status !== 'approved' && r.status !== 'completed'
    ))
  );

// Editable reports (draft or rejected status)
export const useEditableReports = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => 
      r.status === 'draft' || r.status === 'rejected'
    ))
  );

// Reports needing review (for doctors)
export const useReportsNeedingReview = () => 
  useReportStore(
    useShallow((state) => state.reports.filter((r) => r.status === 'under_review'))
  );

// Helper to check if a report is editable
export const isReportEditable = (report: Report | null): boolean => {
  if (!report) return false;
  return report.status === 'draft' || report.status === 'rejected';
};
