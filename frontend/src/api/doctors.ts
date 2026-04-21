import api from './client';
import type {
  Doctor,
  CreateDoctorData,
  ApiResponse,
  DoctorStatement,
} from '../types';

// ==========================================
// Doctor API Endpoints
// ==========================================

export const doctorApi = {
  /**
   * Get all doctors (optionally filter by branch_id)
   */
  getAll: async (params?: { branch_id?: string }): Promise<ApiResponse<Doctor[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.branch_id) {
      queryParams.append('branch_id', params.branch_id);
    }
    const queryString = queryParams.toString();
    const response = await api.get<ApiResponse<Doctor[]>>(`/doctors${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  /**
   * Get doctor by ID
   */
  getById: async (id: string): Promise<ApiResponse<Doctor>> => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data;
  },

  /**
   * Create new doctor
   */
  create: async (data: CreateDoctorData): Promise<ApiResponse<Doctor>> => {
    const response = await api.post<ApiResponse<Doctor>>('/doctors', data);
    return response.data;
  },

  /**
   * Update doctor
   */
  update: async (id: string, data: Partial<CreateDoctorData>): Promise<ApiResponse<Doctor>> => {
    const response = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return response.data;
  },

  /**
   * Delete doctor
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/doctors/${id}`);
    return response.data;
  },

  /**
   * Get doctor statement for commission settlement
   */
  getStatement: async (id: string, startDate: string, endDate: string): Promise<ApiResponse<DoctorStatement>> => {
    const response = await api.get<ApiResponse<DoctorStatement>>(
      `/doctors/${id}/statement?start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  },
};
