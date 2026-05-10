import api from './client';
import type { ApiResponse } from '../types';

// ==========================================
// Types
// ==========================================

export interface Settings {
  id?: string;
  branch_id: string;
  letterhead_url?: string | null;
  owner_signature_url?: string | null;
  header_url?: string | null;
  footer_url?: string | null;
  report_margin_top?: number;
  report_margin_bottom?: number;
  report_margin_left?: number;
  report_margin_right?: number;
  // Lab signatures (up to 4)
  signature_1_url?: string | null;
  signature_1_label?: string | null;
  signature_2_url?: string | null;
  signature_2_label?: string | null;
  signature_3_url?: string | null;
  signature_3_label?: string | null;
  signature_4_url?: string | null;
  signature_4_label?: string | null;
  default_signature_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsUpdateData {
  branch_id?: string;
  letterhead_url?: string | null;
  owner_signature_url?: string | null;
  letterhead_base64?: string;
  owner_signature_base64?: string;
  header_url?: string | null;
  footer_url?: string | null;
  header_base64?: string;
  footer_base64?: string;
  report_margin_top?: number;
  report_margin_bottom?: number;
  report_margin_left?: number;
  report_margin_right?: number;
  default_signature_index?: number;
}

// ==========================================
// Settings API Endpoints
// ==========================================

export const settingsApi = {
  /**
   * Get settings for current user's branch
   */
  getSettings: async (branchId?: string): Promise<ApiResponse<Settings>> => {
    const response = await api.get<ApiResponse<Settings>>('/settings', { params: { branch_id: branchId } });
    return response.data;
  },

  /**
   * Update settings (supports both file upload and base64)
   */
  updateSettings: async (data: SettingsUpdateData): Promise<ApiResponse<Settings>> => {
    const response = await api.post<ApiResponse<Settings>>('/settings', data);
    return response.data;
  },

  /**
   * Remove/clear a specific image field
   */
  removeImage: async (branchId: string, field: string): Promise<ApiResponse<Settings>> => {
    const response = await api.delete<ApiResponse<Settings>>(`/settings/image/${field}`, {
      params: { branch_id: branchId }
    });
    return response.data;
  },

  /**
   * Upload letterhead image
   */
  uploadLetterhead: async (branchId: string, file: File): Promise<ApiResponse<Settings>> => {
    const formData = new FormData();
    formData.append('letterhead', file);
    
    const response = await api.patch<ApiResponse<Settings>>(`/settings/letterhead?branch_id=${branchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload owner signature image (legacy)
   */
  uploadOwnerSignature: async (branchId: string, file: File): Promise<ApiResponse<Settings>> => {
    const formData = new FormData();
    formData.append('owner_signature', file);
    
    const response = await api.patch<ApiResponse<Settings>>(`/settings/owner-signature?branch_id=${branchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload lab signature (index 1-4)
   */
  uploadLabSignature: async (branchId: string, index: number, file: File, label?: string): Promise<ApiResponse<Settings>> => {
    const formData = new FormData();
    formData.append('signature', file);
    if (label) formData.append('label', label);
    
    const response = await api.patch<ApiResponse<Settings>>(`/settings/signature/${index}?branch_id=${branchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update signature label
   */
  updateSignatureLabel: async (branchId: string, index: number, label: string): Promise<ApiResponse<Settings>> => {
    const response = await api.put<ApiResponse<Settings>>(`/settings/signature/${index}/label?branch_id=${branchId}`, { label });
    return response.data;
  },

  /**
   * Update default signature index
   */
  updateDefaultSignature: async (branchId: string, index: number): Promise<ApiResponse<Settings>> => {
    const response = await api.put<ApiResponse<Settings>>(`/settings/default-signature?branch_id=${branchId}`, { index });
    return response.data;
  },

  /**
   * Upload doctor signature
   */
  uploadDoctorSignature: async (branchId: string, doctorId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('signature', file);
    
    const response = await api.patch<ApiResponse<any>>(`/settings/doctors/${doctorId}/signature?branch_id=${branchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};