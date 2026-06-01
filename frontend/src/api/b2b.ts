import { api } from './client';
import type { B2BLab, CreateB2BLabData } from '../types/b2b';

const BASE = '/b2b';

// ==========================================
// B2B PARTNER LAB API (Simplified)
// ==========================================

export const b2bApi = {
  createLab: async (data: CreateB2BLabData) => {
    const res = await api.post(`${BASE}/labs`, data);
    return res.data.data as B2BLab;
  },

  getLabs: async () => {
    const res = await api.get(`${BASE}/labs`);
    return res.data.data as B2BLab[];
  },

  getLabById: async (id: string) => {
    const res = await api.get(`${BASE}/labs/${id}`);
    return res.data.data as B2BLab;
  },

  updateLab: async (id: string, data: Partial<B2BLab>) => {
    const res = await api.put(`${BASE}/labs/${id}`, data);
    return res.data.data as B2BLab;
  },

  deleteLab: async (id: string) => {
    const res = await api.delete(`${BASE}/labs/${id}`);
    return res.data;
  },

  // Get B2B lab statement with reports for a date range
  getStatement: async (labId: string, startDate: string, endDate: string) => {
    const res = await api.get(`${BASE}/labs/${labId}/statement`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },
};
