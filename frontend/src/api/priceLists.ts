import api from './client';
import type { ApiResponse, PriceList, PriceListItem, ReportTestPriceSnapshot } from '../types';

export const priceListApi = {
  /**
   * Get all price lists, optionally filtered by branch_id
   */
  getAll: async (params?: { branch_id?: string; is_active?: boolean }): Promise<ApiResponse<PriceList[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.branch_id) {
      queryParams.append('branch_id', params.branch_id);
    }
    if (params?.is_active !== undefined) {
      queryParams.append('is_active', params.is_active.toString());
    }
    const queryString = queryParams.toString();
    const response = await api.get<ApiResponse<PriceList[]>>(`/price-lists${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  /**
   * Get price list by ID with items
   */
  getById: async (id: string): Promise<ApiResponse<PriceList>> => {
    const response = await api.get<ApiResponse<PriceList>>(`/price-lists/${id}`);
    return response.data;
  },

  /**
   * Create a new price list
   */
  create: async (data: Partial<PriceList>): Promise<ApiResponse<PriceList>> => {
    const response = await api.post<ApiResponse<PriceList>>('/price-lists', data);
    return response.data;
  },

  /**
   * Update price list details
   */
  update: async (id: string, data: Partial<PriceList>): Promise<ApiResponse<PriceList>> => {
    const response = await api.put<ApiResponse<PriceList>>(`/price-lists/${id}`, data);
    return response.data;
  },

  /**
   * Delete price list
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/price-lists/${id}`);
    return response.data;
  },

  /**
   * Bulk update items in price list
   */
  bulkUpdateItems: async (id: string, items: Partial<PriceListItem>[]): Promise<ApiResponse<PriceList>> => {
    const response = await api.put<ApiResponse<PriceList>>(`/price-lists/${id}/items`, { items });
    return response.data;
  },

  /**
   * Remove item from price list
   */
  deleteItem: async (id: string, testId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/price-lists/${id}/items/${testId}`);
    return response.data;
  },
};

export const pricingEngineApi = {
  /**
   * Resolve prices for tests
   */
  resolve: async (data: {
    testIds: string[];
    branchId: string;
    doctorId?: string | null;
    reportPriceListId?: string | null;
  }): Promise<Record<string, ReportTestPriceSnapshot>> => {
    const response = await api.post<Record<string, ReportTestPriceSnapshot>>('/pricing/resolve', data);
    return response.data;
  },
};
