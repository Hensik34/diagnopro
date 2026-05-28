import api from './client';
import type {
  Test,
  CreateTestData,
  SampleTest,
  UpdateTestResultData,
  TestField,
  CreateTestFieldData,
  ApiResponse,
} from '../types';

// ==========================================
// Test API Endpoints
// ==========================================

export const testApi = {
  /**
   * Get all tests for a branch with optional category filter
   */
  getAll: async (branchId: string, category?: string): Promise<ApiResponse<Test[]>> => {
    const params = new URLSearchParams({ branch_id: branchId });
    if (category) params.append('category', category);
    const response = await api.get<ApiResponse<Test[]>>(`/tests?${params.toString()}`);
    return response.data;
  },

  /**
   * Get test by ID
   */
  getById: async (id: string, branchId?: string): Promise<ApiResponse<Test>> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    const response = await api.get<ApiResponse<Test>>(qs ? `/tests/${id}?${qs}` : `/tests/${id}`);
    return response.data;
  },

  /**
   * Create new test (master list)
   */
  create: async (data: CreateTestData): Promise<ApiResponse<Test>> => {
    const response = await api.post<ApiResponse<Test>>('/tests', data);
    return response.data;
  },

  /**
   * Update test
   */
  update: async (id: string, data: Partial<CreateTestData>, branchId?: string): Promise<ApiResponse<Test>> => {
    const payload = branchId ? { ...data, branch_id: branchId } : data;
    const response = await api.put<ApiResponse<Test>>(`/tests/${id}`, payload);
    return response.data;
  },

  /**
   * Delete test
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/tests/${id}`);
    return response.data;
  },

  // ==========================================
  // Sample Tests (Tests assigned to samples)
  // ==========================================

  /**
   * Get tests assigned to a sample
   */
  getTestsForSample: async (sampleId: string): Promise<ApiResponse<SampleTest[]>> => {
    const response = await api.get<ApiResponse<SampleTest[]>>(`/tests/sample/${sampleId}`);
    return response.data;
  },

  /**
   * Add test to a sample
   */
  addTestToSample: async (sampleId: string, testId: string): Promise<ApiResponse<SampleTest>> => {
    const response = await api.post<ApiResponse<SampleTest>>(`/tests/sample/${sampleId}`, {
      test_id: testId,
    });
    return response.data;
  },

  /**
   * Update test result for a sample test
   */
  updateTestResult: async (
    sampleTestId: string,
    data: UpdateTestResultData
  ): Promise<ApiResponse<SampleTest>> => {
    const response = await api.patch<ApiResponse<SampleTest>>(
      `/tests/result/${sampleTestId}`,
      data
    );
    return response.data;
  },

  // ==========================================
  // Test Fields (Dynamic Parameters)
  // ==========================================

  getFields: async (testId: string, branchId?: string): Promise<ApiResponse<TestField[]>> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    const response = await api.get<ApiResponse<TestField[]>>(qs ? `/tests/${testId}/fields?${qs}` : `/tests/${testId}/fields`);
    return response.data;
  },

  getFieldsMulti: async (testIds: string[], branchId?: string): Promise<ApiResponse<TestField[]>> => {
    const response = await api.post<ApiResponse<TestField[]>>('/tests/fields/multi', { testIds, branch_id: branchId });
    return response.data;
  },

  setFields: async (testId: string, fields: CreateTestFieldData[], branchId?: string): Promise<ApiResponse<TestField[]>> => {
    const response = await api.put<ApiResponse<TestField[]>>(`/tests/${testId}/fields`, { fields, branch_id: branchId });
    return response.data;
  },

  /**
   * Reset branch-specific test override (revert to global default)
   */
  resetToDefault: async (testId: string, branchId: string): Promise<ApiResponse<Test>> => {
    const response = await api.delete<ApiResponse<Test>>(`/tests/${testId}/override`, {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  deleteField: async (fieldId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/tests/fields/${fieldId}`);
    return response.data;
  },
};
