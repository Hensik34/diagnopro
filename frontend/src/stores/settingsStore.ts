import { create } from 'zustand';
import { settingsApi } from '../api';
import type { Settings, SettingsUpdateData } from '../api/settings';
import { useBranchStore } from './branchStore';

// ==========================================
// Settings Store State Interface
// ==========================================

interface SettingsState {
  // State
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSettings: (branchId?: string) => Promise<void>;
  updateSettings: (data: SettingsUpdateData) => Promise<Settings | null>;
  removeImage: (field: string) => Promise<Settings | null>;
  uploadLetterhead: (branchId: string, file: File) => Promise<Settings | null>;
  uploadOwnerSignature: (branchId: string, file: File) => Promise<Settings | null>;
  uploadLabSignature: (branchId: string, index: number, file: File, label?: string) => Promise<Settings | null>;
  updateSignatureLabel: (branchId: string, index: number, label: string) => Promise<Settings | null>;
  updateDefaultSignature: (branchId: string, index: number) => Promise<Settings | null>;
  uploadDoctorSignature: (branchId: string, doctorId: string, file: File) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  settings: null,
  isLoading: false,
  error: null,
};

// ==========================================
// Helper: get current branch_id
// ==========================================

function getCurrentBranchId(): string | null {
  return useBranchStore.getState().currentBranchId;
}

// ==========================================
// Settings Store Implementation
// ==========================================

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initialState,

  /**
   * Fetch settings for current user's branch
   */
  fetchSettings: async (branchId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await settingsApi.getSettings(branchId);
      set({
        settings: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Update settings (supports base64 images)
   * Automatically injects branch_id from current branch
   */
  updateSettings: async (data: SettingsUpdateData) => {
    const branchId = data.branch_id || getCurrentBranchId();
    if (!branchId) {
      set({ error: 'Branch ID not found. Please select a branch.' });
      return null;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await settingsApi.updateSettings({ ...data, branch_id: branchId });
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Remove/clear a specific image field
   */
  removeImage: async (field: string) => {
    const branchId = getCurrentBranchId();
    if (!branchId) {
      set({ error: 'Branch ID not found. Please select a branch.' });
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await settingsApi.removeImage(branchId, field);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove image';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Upload letterhead image
   */
  uploadLetterhead: async (branchId: string, file: File) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await settingsApi.uploadLetterhead(branchId, file);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload letterhead';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Upload owner signature image (legacy)
   */
  uploadOwnerSignature: async (branchId: string, file: File) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await settingsApi.uploadOwnerSignature(branchId, file);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload owner signature';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Upload lab signature (1-4)
   */
  uploadLabSignature: async (branchId: string, index: number, file: File, label?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await settingsApi.uploadLabSignature(branchId, index, file, label);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload signature';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update a signature label
   */
  updateSignatureLabel: async (branchId: string, index: number, label: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await settingsApi.updateSignatureLabel(branchId, index, label);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update label';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update default signature index
   */
  updateDefaultSignature: async (branchId: string, index: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await settingsApi.updateDefaultSignature(branchId, index);
      set({
        settings: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update default signature';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Upload doctor signature
   */
  uploadDoctorSignature: async (branchId: string, doctorId: string, file: File) => {
    set({ isLoading: true, error: null });
    
    try {
      await settingsApi.uploadDoctorSignature(branchId, doctorId, file);
      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload doctor signature';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store to initial state
   */
  reset: () => set(initialState),
}));