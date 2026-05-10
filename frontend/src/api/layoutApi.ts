import { apiClient } from './index';
import type { TestLayout, ReportLayoutTemplate } from '../types/reportLayout';

export const layoutApi = {
  /**
   * Get all layout templates for a branch
   */
  getTemplates: (branchId: string) =>
    apiClient.get(`/reports/layouts/templates?branch_id=${branchId}`),

  /**
   * Get a specific layout template
   */
  getTemplate: (templateId: string) =>
    apiClient.get(`/reports/layouts/templates/${templateId}`),

  /**
   * Create new layout template
   */
  createTemplate: (data: Partial<ReportLayoutTemplate>) =>
    apiClient.post('/reports/layouts/templates', data),

  /**
   * Update layout template
   */
  updateTemplate: (templateId: string, data: Partial<ReportLayoutTemplate>) =>
    apiClient.put(`/reports/layouts/templates/${templateId}`, data),

  /**
   * Delete layout template
   */
  deleteTemplate: (templateId: string) =>
    apiClient.delete(`/reports/layouts/templates/${templateId}`),

  /**
   * Get layout for a specific test
   */
  getTestLayout: (testId: string, branchId?: string) =>
    apiClient.get(
      `/reports/layouts/tests/${testId}${branchId ? `?branch_id=${branchId}` : ''}`
    ),

  /**
   * Save/update layout for a specific test
   */
  saveTestLayout: (data: TestLayout) =>
    apiClient.post('/reports/layouts/tests', data),

  /**
   * Duplicate a layout template
   */
  duplicateTemplate: (templateId: string, newName: string) =>
    apiClient.post(`/reports/layouts/templates/${templateId}/duplicate`, { name: newName }),

  /**
   * Apply a template to all tests in a branch
   */
  applyTemplate: (templateId: string, branchId: string) =>
    apiClient.post('/reports/layouts/templates/apply', { templateId, branchId }),
};
