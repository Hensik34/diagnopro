import api, { publicApi } from './client';
import type {
  Report,
  CreateReportData,
  UpdateReportData,
  ReportFilters,
  ReportStatus,
  ApiResponse,
} from '../types';

// ==========================================
// Report API Types
// ==========================================

export interface ReportsSummary {
  total: number;
  draft: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export interface ReportsSummaryResponse {
  message: string;
  summary: ReportsSummary;
  totalReports: number;
}

// ==========================================
// Report API Endpoints
// ==========================================

export const reportApi = {
  /**
   * Get all reports with optional filters
   */
  getAll: async (filters?: ReportFilters): Promise<ApiResponse<Report[]>> => {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    
    const response = await api.get<ApiResponse<Report[]>>(`/reports?${params.toString()}`);
    return response.data;
  },

  /**
   * Get reports summary (counts by status)
   */
  getSummary: async (branchId?: string): Promise<ReportsSummaryResponse> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    const response = await api.get<ReportsSummaryResponse>(`/reports/summary${params}`);
    return response.data;
  },

  /**
   * Get report by ID
   */
  getById: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.get<ApiResponse<Report>>(`/reports/${id}`);
    return response.data;
  },

  /**
   * Get public report by ID with verification token (unauthenticated)
   */
  getPublicById: async (id: string, token: string): Promise<ApiResponse<Report>> => {
    const response = await publicApi.get<ApiResponse<Report>>(`/reports/public/${id}?token=${token}`);
    return response.data;
  },


  /**
   * Get reports by patient ID
   */
  getByPatient: async (patientId: string): Promise<ApiResponse<Report[]>> => {
    const response = await api.get<ApiResponse<Report[]>>(`/reports/patient/${patientId}`);
    return response.data;
  },

  /**
   * Create new report (status: draft)
   */
  create: async (data: CreateReportData): Promise<ApiResponse<Report>> => {
    const response = await api.post<ApiResponse<Report>>('/reports', data);
    return response.data;
  },

  /**
   * Update report content (only for draft/rejected reports)
   */
  update: async (id: string, data: UpdateReportData): Promise<ApiResponse<Report>> => {
    const response = await api.put<ApiResponse<Report>>(`/reports/${id}`, data);
    return response.data;
  },

  // ==========================================
  // WORKFLOW ACTIONS
  // ==========================================

  /**
   * Submit report for review (draft/rejected → under_review)
   */
  submit: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/submit`);
    return response.data;
  },

  /**
   * Approve report (under_review → approved)
   */
  approve: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/approve`);
    return response.data;
  },

  /**
   * Reject report (under_review → rejected)
   */
  reject: async (id: string, reason: string): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Revise rejected report (rejected → draft)
   */
  revise: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/revise`);
    return response.data;
  },

  // ==========================================
  // LEGACY/UTILITY ACTIONS
  // ==========================================

  /**
   * Update report status (legacy workflow)
   */
  updateStatus: async (id: string, status: ReportStatus): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/status`, { status });
    return response.data;
  },

  /**
   * Assign technician to report
   */
  assignTechnician: async (id: string, technicianId: string): Promise<ApiResponse<Report>> => {
    const response = await api.patch<ApiResponse<Report>>(`/reports/${id}/assign-technician`, {
      technician_id: technicianId,
    });
    return response.data;
  },

  /**
   * Delete report
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/reports/${id}`);
    return response.data;
  },

  /**
   * Send report via WhatsApp or Email
   */
  send: async (id: string, channel: 'whatsapp' | 'email', recipientType: 'patient' | 'doctor'): Promise<ApiResponse<{
    channel: string;
    recipient_type: string;
    recipient_name: string;
    recipient_phone?: string;
    recipient_email?: string;
    whatsapp_url?: string;
    text_message?: string;
    subject?: string;
    body?: string;
  }>> => {
    const response = await api.post<ApiResponse<any>>(`/reports/${id}/send`, {
      channel,
      recipient_type: recipientType,
    });
    return response.data;
  },

  /**
   * Generate AI clinical significance / interpretation
   */
  generateInterpretation: async (id: string): Promise<ApiResponse<{
    summary: string;
    keyFindings: string;
    clinicalIndications: string;
    recommendation: string;
    raw: string;
    model: string;
    tokens: number;
  }>> => {
    const response = await api.post<ApiResponse<any>>(`/reports/${id}/generate-interpretation`);
    return response.data;
  },
};
