import api from './client';
import type {
  CollectionTracking,
  CreateCollectionTrackingData,
  CollectionTrackingFilters,
  CollectionSalarySummary,
  StaffListItem,
  ApiResponse,
} from '../types';

export const collectionTrackingApi = {
  getAll: async (filters?: CollectionTrackingFilters): Promise<ApiResponse<CollectionTracking[]>> => {
    const params = new URLSearchParams();
    if (filters?.staff_id) params.append('staff_id', filters.staff_id);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.date) params.append('date', filters.date);
    const response = await api.get<ApiResponse<CollectionTracking[]>>(`/collection-tracking?${params.toString()}`);
    return response.data;
  },

  getToday: async (): Promise<ApiResponse<CollectionTracking[]>> => {
    const response = await api.get<ApiResponse<CollectionTracking[]>>('/collection-tracking/today');
    return response.data;
  },

  getMyRecords: async (filters?: { date_from?: string; date_to?: string }): Promise<ApiResponse<CollectionTracking[]>> => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    const response = await api.get<ApiResponse<CollectionTracking[]>>(`/collection-tracking/my-records?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CollectionTracking>> => {
    const response = await api.get<ApiResponse<CollectionTracking>>(`/collection-tracking/${id}`);
    return response.data;
  },

  getSummary: async (staffId: string, dateFrom: string, dateTo: string): Promise<ApiResponse<CollectionSalarySummary>> => {
    const params = new URLSearchParams({ staff_id: staffId, date_from: dateFrom, date_to: dateTo });
    const response = await api.get<ApiResponse<CollectionSalarySummary>>(`/collection-tracking/summary?${params.toString()}`);
    return response.data;
  },

  getStaffList: async (): Promise<ApiResponse<StaffListItem[]>> => {
    const response = await api.get<ApiResponse<StaffListItem[]>>('/collection-tracking/staff-list');
    return response.data;
  },

  create: async (data: CreateCollectionTrackingData): Promise<ApiResponse<CollectionTracking>> => {
    const response = await api.post<ApiResponse<CollectionTracking>>('/collection-tracking', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCollectionTrackingData>): Promise<ApiResponse<CollectionTracking>> => {
    const response = await api.put<ApiResponse<CollectionTracking>>(`/collection-tracking/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/collection-tracking/${id}`);
    return response.data;
  },
};
