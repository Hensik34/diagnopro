import { create } from 'zustand';
import { testApi } from '../api';
import { useBranchStore } from './branchStore';
import type { Test, CreateTestData, SampleTest, UpdateTestResultData, TestField, CreateTestFieldData } from '../types';

// ==========================================
// Test Store State Interface
// ==========================================

interface TestState {
  // State - Master test list
  tests: Test[];
  selectedTest: Test | null;
  
  // State - Sample tests (tests assigned to a sample)
  sampleTests: SampleTest[];
  currentSampleId: string | null;

  // State - Test fields (parameters for a test)
  testFields: TestField[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  categoryFilter: string | null;

  // Actions - Master tests
  fetchTests: (branchId?: string, category?: string) => Promise<void>;
  fetchTestById: (id: string) => Promise<void>;
  createTest: (data: CreateTestData) => Promise<Test | null>;
  updateTest: (id: string, data: Partial<CreateTestData>) => Promise<Test | null>;
  deleteTest: (id: string) => Promise<boolean>;
  resetTestToDefault: (testId: string) => Promise<boolean>;
  
  // Actions - Test fields
  fetchTestFields: (testId: string) => Promise<void>;
  fetchTestFieldsMulti: (testIds: string[]) => Promise<void>;
  setTestFields: (testId: string, fields: CreateTestFieldData[]) => Promise<boolean>;

  // Actions - Sample tests
  fetchTestsForSample: (sampleId: string) => Promise<void>;
  addTestToSample: (sampleId: string, testId: string) => Promise<SampleTest | null>;
  updateTestResult: (sampleTestId: string, data: UpdateTestResultData) => Promise<SampleTest | null>;
  
  // Actions - UI
  setSelectedTest: (test: Test | null) => void;
  setCategoryFilter: (category: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  tests: [],
  selectedTest: null,
  sampleTests: [],
  currentSampleId: null,
  testFields: [],
  isLoading: false,
  error: null,
  categoryFilter: null,
};

// ==========================================
// Test Store Implementation
// ==========================================

export const useTestStore = create<TestState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Master Test Actions
  // ==========================================

  /**
   * Fetch all tests for a branch with optional category filter
   */
  fetchTests: async (branchId?: string, category?: string) => {
    if (!branchId) return;
    set({ isLoading: true, error: null });

    try {
      const filterCategory = category ?? get().categoryFilter ?? undefined;
      const response = await testApi.getAll(branchId, filterCategory);
      
      set({
        tests: response.data,
        categoryFilter: filterCategory || null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tests';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single test by ID
   */
  fetchTestById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const branchId = useBranchStore.getState().currentBranchId || undefined;
      const response = await testApi.getById(id, branchId);
      set({
        selectedTest: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch test';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new test (master list)
   */
  createTest: async (data: CreateTestData): Promise<Test | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await testApi.create(data);
      const newTest = response.data;
      
      // Add to local cache
      set((state) => ({
        tests: [newTest, ...state.tests],
        isLoading: false,
      }));
      
      return newTest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update test (admin updates global test, non-admins create branch overrides)
   */
  updateTest: async (id: string, data: Partial<CreateTestData>): Promise<Test | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const branchId = useBranchStore.getState().currentBranchId || undefined;
      await testApi.update(id, data, branchId);
      
      // Re-fetch the test with merged data from backend
      const mergedResponse = await testApi.getById(id, branchId);
      const mergedTest = mergedResponse.data;
      
      // Update local cache with merged data from backend
      set((state) => ({
        tests: state.tests.map((t) => 
          t.id === id ? mergedTest : t
        ),
        selectedTest: state.selectedTest?.id === id 
          ? mergedTest
          : state.selectedTest,
        isLoading: false,
      }));
      
      return mergedTest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update test';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Delete test
   */
  deleteTest: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      await testApi.delete(id);
      
      // Remove from local cache
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
        selectedTest: state.selectedTest?.id === id 
          ? null 
          : state.selectedTest,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete test';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Reset test to default (remove branch override)
   */
  resetTestToDefault: async (testId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      const branchId = useBranchStore.getState().currentBranchId;
      if (!branchId) {
        set({ error: 'No branch selected', isLoading: false });
        return false;
      }

      const response = await testApi.resetToDefault(testId, branchId);
      const defaultTest = response?.data;
      
      // Update local cache - replace with merged default data, remove override flag
      // If defaultTest is null/undefined (already deleted), just clear the override flag
      set((state) => ({
        tests: state.tests.map((t) => 
          t.id === testId 
            ? { ...(defaultTest || t), has_branch_override: false } 
            : t
        ),
        selectedTest: state.selectedTest?.id === testId 
          ? { ...(defaultTest || state.selectedTest), has_branch_override: false }
          : state.selectedTest,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset test';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ==========================================
  // Test Field Actions
  // ==========================================

  /**
   * Fetch fields/parameters for a specific test
   */
  fetchTestFields: async (testId: string) => {
    set({ isLoading: true, error: null });

    try {
      const branchId = useBranchStore.getState().currentBranchId || undefined;
      const response = await testApi.getFields(testId, branchId);
      set({ testFields: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch test fields';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch fields/parameters for multiple tests at once
   */
  fetchTestFieldsMulti: async (testIds: string[]) => {
    set({ isLoading: true, error: null });

    try {
      const branchId = useBranchStore.getState().currentBranchId || undefined;
      const response = await testApi.getFieldsMulti(testIds, branchId);
      set({ testFields: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch test fields';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Set (replace all) fields for a test
   */
  setTestFields: async (testId: string, fields: CreateTestFieldData[]): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const branchId = useBranchStore.getState().currentBranchId || undefined;
      await testApi.setFields(testId, fields, branchId);
      // Refetch merged fields from backend (defaults + branch overrides)
      const response = await testApi.getFields(testId, branchId);
      set({ testFields: response.data, isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save test fields';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ==========================================
  // Sample Test Actions
  // ==========================================

  /**
   * Fetch tests assigned to a sample
   */
  fetchTestsForSample: async (sampleId: string) => {
    set({ isLoading: true, error: null, currentSampleId: sampleId });
    
    try {
      const response = await testApi.getTestsForSample(sampleId);
      set({
        sampleTests: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sample tests';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Add a test to a sample
   */
  addTestToSample: async (sampleId: string, testId: string): Promise<SampleTest | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await testApi.addTestToSample(sampleId, testId);
      const newSampleTest = response.data;
      
      // Add to local cache if same sample
      if (get().currentSampleId === sampleId) {
        set((state) => ({
          sampleTests: [...state.sampleTests, newSampleTest],
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
      
      return newSampleTest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add test to sample';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update test result for a sample test
   */
  updateTestResult: async (sampleTestId: string, data: UpdateTestResultData): Promise<SampleTest | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await testApi.updateTestResult(sampleTestId, data);
      const updatedSampleTest = response.data;
      
      // Update local cache
      set((state) => ({
        sampleTests: state.sampleTests.map((st) => 
          st.id === sampleTestId ? updatedSampleTest : st
        ),
        isLoading: false,
      }));
      
      return updatedSampleTest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update test result';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // ==========================================
  // UI Actions
  // ==========================================

  /**
   * Set selected test
   */
  setSelectedTest: (test: Test | null) => {
    set({ selectedTest: test });
  },

  /**
   * Set category filter
   */
  setCategoryFilter: (category: string | null) => {
    set({ categoryFilter: category });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ==========================================
// Selector Hooks for Performance
// ==========================================

export const useTests = () => useTestStore((state) => state.tests);
export const useTestFields = () => useTestStore((state) => state.testFields);
export const useSampleTests = () => useTestStore((state) => state.sampleTests);
export const useSelectedTest = () => useTestStore((state) => state.selectedTest);
export const useTestLoading = () => useTestStore((state) => state.isLoading);
export const useTestError = () => useTestStore((state) => state.error);

// Category-based selector
export const useTestsByCategory = (category: string) => 
  useTestStore((state) => state.tests.filter((t) => t.category === category));

// Get unique categories from tests
export const useTestCategories = () => 
  useTestStore((state) => [...new Set(state.tests.map((t) => t.category).filter(Boolean))]);
