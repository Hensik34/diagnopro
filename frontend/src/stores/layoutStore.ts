import { create } from 'zustand';
import { layoutApi } from '../api/layoutApi';
import type { TestLayout, ReportLayoutTemplate } from '../types/reportLayout';

interface LayoutState {
  // State
  templates: ReportLayoutTemplate[];
  selectedTemplate: ReportLayoutTemplate | null;
  testLayouts: Map<string, TestLayout>; // testId -> layout
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTemplates: (branchId: string) => Promise<void>;
  fetchTemplate: (templateId: string) => Promise<void>;
  createTemplate: (data: Partial<ReportLayoutTemplate>) => Promise<ReportLayoutTemplate | null>;
  updateTemplate: (templateId: string, data: Partial<ReportLayoutTemplate>) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  
  fetchTestLayout: (testId: string, branchId?: string) => Promise<TestLayout | null>;
  saveTestLayout: (layout: TestLayout) => Promise<boolean>;
  
  duplicateTemplate: (templateId: string, newName: string) => Promise<ReportLayoutTemplate | null>;
  applyTemplate: (templateId: string, branchId: string) => Promise<boolean>;
  
  setSelectedTemplate: (template: ReportLayoutTemplate | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  templates: [],
  selectedTemplate: null,
  testLayouts: new Map(),
  isLoading: false,
  error: null,
};

export const useLayoutStore = create<LayoutState>((set, get) => ({
  ...initialState,

  /**
   * Fetch all layout templates for a branch
   */
  fetchTemplates: async (branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.getTemplates(branchId);
      set({
        templates: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch a specific layout template
   */
  fetchTemplate: async (templateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.getTemplate(templateId);
      const template = response.data;
      set((state) => ({
        selectedTemplate: template,
        templates: state.templates.map((t) => t.id === template.id ? template : t),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch template';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new layout template
   */
  createTemplate: async (data: Partial<ReportLayoutTemplate>): Promise<ReportLayoutTemplate | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.createTemplate(data);
      const newTemplate = response.data;
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));
      return newTemplate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update layout template
   */
  updateTemplate: async (templateId: string, data: Partial<ReportLayoutTemplate>): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.updateTemplate(templateId, data);
      const updated = response.data;
      set((state) => ({
        templates: state.templates.map((t) => t.id === templateId ? updated : t),
        selectedTemplate: state.selectedTemplate?.id === templateId ? updated : state.selectedTemplate,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Delete layout template
   */
  deleteTemplate: async (templateId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await layoutApi.deleteTemplate(templateId);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== templateId),
        selectedTemplate: state.selectedTemplate?.id === templateId ? null : state.selectedTemplate,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Fetch layout for a specific test
   */
  fetchTestLayout: async (testId: string, branchId?: string): Promise<TestLayout | null> => {
    try {
      const response = await layoutApi.getTestLayout(testId, branchId);
      const layout = response.data;
      set((state) => ({
        testLayouts: new Map(state.testLayouts).set(testId, layout),
      }));
      return layout;
    } catch (error) {
      console.error('Failed to fetch test layout:', error);
      return null;
    }
  },

  /**
   * Save/update layout for a specific test
   */
  saveTestLayout: async (layout: TestLayout): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.saveTestLayout(layout);
      const saved = response.data;
      set((state) => ({
        testLayouts: new Map(state.testLayouts).set(layout.id, saved),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save layout';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Duplicate a layout template
   */
  duplicateTemplate: async (templateId: string, newName: string): Promise<ReportLayoutTemplate | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await layoutApi.duplicateTemplate(templateId, newName);
      const newTemplate = response.data;
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));
      return newTemplate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate template';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Apply a template to all tests in a branch
   */
  applyTemplate: async (templateId: string, branchId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await layoutApi.applyTemplate(templateId, branchId);
      // Re-fetch templates to get updated state
      await get().fetchTemplates(branchId);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply template';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Set selected template
   */
  setSelectedTemplate: (template: ReportLayoutTemplate | null) => {
    set({ selectedTemplate: template });
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
