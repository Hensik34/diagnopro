import api from './client';
import type {
  Patient,
  CreatePatientData,
  PatientFilters,
  ApiResponse,
} from '../types';

// ==========================================
// Patient API Endpoints
// ==========================================

export const patientApi = {
  /**
   * Get all patients with optional filters
   */
  getAll: async (filters?: PatientFilters): Promise<ApiResponse<Patient[]>> => {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.created_by) params.append('created_by', filters.created_by);
    if (filters?.today_only) params.append('today_only', 'true');
    
    const response = await api.get<ApiResponse<Patient[]>>(`/patients?${params.toString()}`);
    return response.data;
  },

  /**
   * Get patient by ID
   */
  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data;
  },

  /**
   * Create new patient
   */
  create: async (data: CreatePatientData): Promise<ApiResponse<Patient>> => {
    const response = await api.post<ApiResponse<Patient>>('/patients', data);
    return response.data;
  },

  /**
   * Update patient
   */
  update: async (id: string, data: Partial<CreatePatientData>): Promise<ApiResponse<Patient>> => {
    const response = await api.put<ApiResponse<Patient>>(`/patients/${id}`, data);
    return response.data;
  },

  /**
   * Delete patient
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/patients/${id}`);
    return response.data;
  },
};
