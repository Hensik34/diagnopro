import api from './client';
import type { Branch, ApiResponse } from '../types';

// ==========================================
// Branch API Endpoints
// ==========================================

export const branchApi = {
  /**
   * Get all branches
   */
  getAll: async (): Promise<ApiResponse<Branch[]>> => {
    const response = await api.get<ApiResponse<Branch[]>>('/branches');
    return response.data;
  },

  /**
   * Get branch by ID
   */
  getById: async (id: string): Promise<ApiResponse<Branch>> => {
    const response = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
    return response.data;
  },

  /**
   * Create new branch
   */
  create: async (data: Partial<Branch>): Promise<ApiResponse<Branch>> => {
    const response = await api.post<ApiResponse<Branch>>('/branches', data);
    return response.data;
  },

  /**
   * Update branch
   */
  update: async (id: string, data: Partial<Branch>): Promise<ApiResponse<Branch>> => {
    const response = await api.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return response.data;
  },

  /**
   * Delete branch
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/branches/${id}`);
    return response.data;
  },
};
