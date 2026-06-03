import api from './client';
import type {
  Sample,
  CreateSampleData,
  SampleFilters,
  ApiResponse,
} from '../types';

// ==========================================
// Sample API Endpoints
// ==========================================

export const sampleApi = {
  /**
   * Get all samples with optional filters
   */
  getAll: async (filters?: SampleFilters): Promise<ApiResponse<Sample[]>> => {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patient_id) params.append('patient_id', filters.patient_id);
    
    const response = await api.get<ApiResponse<Sample[]>>(`/samples?${params.toString()}`);
    return response.data;
  },

  /**
   * Get next auto-generated sample ID
   */
  getNextId: async (branchId?: string): Promise<{ message: string; data: { sample_id_code: string } }> => {
    const response = await api.get<{ message: string; data: { sample_id_code: string } }>('/samples/next-id', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  /**
   * Get sample by ID
   */
  getById: async (id: string): Promise<ApiResponse<Sample>> => {
    const response = await api.get<ApiResponse<Sample>>(`/samples/${id}`);
    return response.data;
  },

  /**
   * Get samples by patient ID
   */
  getByPatient: async (patientId: string): Promise<ApiResponse<Sample[]>> => {
    const response = await api.get<ApiResponse<Sample[]>>(`/samples/patient/${patientId}`);
    return response.data;
  },

  /**
   * Create new sample
   */
  create: async (data: CreateSampleData): Promise<ApiResponse<Sample>> => {
    const response = await api.post<ApiResponse<Sample>>('/samples', data);
    return response.data;
  },

  /**
   * Update sample
   */
  update: async (id: string, data: Partial<CreateSampleData>): Promise<ApiResponse<Sample>> => {
    const response = await api.put<ApiResponse<Sample>>(`/samples/${id}`, data);
    return response.data;
  },

  /**
   * Delete sample
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/samples/${id}`);
    return response.data;
  },
};
