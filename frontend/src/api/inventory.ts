import api from './client';
import type { InventoryItem, CreateInventoryData, ApiResponse } from '../types';

export const inventoryApi = {
  getAll: async (branchId: string): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(`/inventory?branch_id=${branchId}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<InventoryItem>> => {
    const response = await api.get<ApiResponse<InventoryItem>>(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: CreateInventoryData): Promise<ApiResponse<InventoryItem>> => {
    const response = await api.post<ApiResponse<InventoryItem>>('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInventoryData>): Promise<ApiResponse<InventoryItem>> => {
    const response = await api.put<ApiResponse<InventoryItem>>(`/inventory/${id}`, data);
    return response.data;
  },

  addStock: async (id: string, quantity: number): Promise<ApiResponse<InventoryItem>> => {
    const response = await api.patch<ApiResponse<InventoryItem>>(`/inventory/${id}/restock`, { quantity });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/inventory/${id}`);
    return response.data;
  },
};
