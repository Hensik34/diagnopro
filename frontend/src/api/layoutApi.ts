import { api as apiClient } from './index';
import type { LayoutConfig } from '../types/reportLayout';

export const layoutApi = {
  /**
   * Get layout for a specific test
   */
  getTestLayout: (testId: string, branchId?: string) =>
    apiClient.get(`/test-layouts/${testId}${branchId ? `?branch_id=${branchId}` : ''}`),

  updateTestLayout: (testId: string, data: { layoutConfig: LayoutConfig; updated_at: string }, branchId?: string) =>
    apiClient.put(`/test-layouts/${testId}${branchId ? `?branch_id=${branchId}` : ''}`, data),
};
