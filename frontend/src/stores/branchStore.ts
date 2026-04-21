import { create } from 'zustand';
import { branchApi } from '../api';
import type { Branch } from '../types';

// ==========================================
// Branch Store State Interface
// ==========================================

interface BranchState {
  // State
  branches: Branch[];
  selectedBranch: Branch | null;
  currentBranchId: string | null; // User's active branch
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<void>;
  createBranch: (data: Partial<Branch>) => Promise<Branch | null>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<Branch | null>;
  deleteBranch: (id: string) => Promise<boolean>;
  setSelectedBranch: (branch: Branch | null) => void;
  setCurrentBranchId: (branchId: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  branches: [],
  selectedBranch: null,
  currentBranchId: null,
  isLoading: false,
  error: null,
};

// ==========================================
// Branch Store Implementation
// ==========================================

export const useBranchStore = create<BranchState>((set) => ({
  ...initialState,

  /**
   * Fetch all branches
   */
  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await branchApi.getAll();
      set({
        branches: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch branches';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single branch by ID
   */
  fetchBranchById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await branchApi.getById(id);
      set({
        selectedBranch: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch branch';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new branch
   */
  createBranch: async (data: Partial<Branch>): Promise<Branch | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await branchApi.create(data);
      const newBranch = response.data;
      
      set((state) => ({
        branches: [newBranch, ...state.branches],
        isLoading: false,
      }));
      
      return newBranch;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create branch';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update branch
   */
  updateBranch: async (id: string, data: Partial<Branch>): Promise<Branch | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await branchApi.update(id, data);
      const updatedBranch = response.data;
      
      set((state) => ({
        branches: state.branches.map((b) => 
          b.id === id ? updatedBranch : b
        ),
        selectedBranch: state.selectedBranch?.id === id 
          ? updatedBranch 
          : state.selectedBranch,
        isLoading: false,
      }));
      
      return updatedBranch;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update branch';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Delete branch
   */
  deleteBranch: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      await branchApi.delete(id);
      
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== id),
        selectedBranch: state.selectedBranch?.id === id 
          ? null 
          : state.selectedBranch,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete branch';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Set selected branch
   */
  setSelectedBranch: (branch: Branch | null) => {
    set({ selectedBranch: branch });
  },

  /**
   * Set current active branch
   */
  setCurrentBranchId: (branchId: string | null) => {
    set({ currentBranchId: branchId });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store
   */
  reset: () => {
    set(initialState);
  },
}));

// ==========================================
// Selector Hooks
// ==========================================

export const useBranches = () => useBranchStore((state) => state.branches);
export const useSelectedBranch = () => useBranchStore((state) => state.selectedBranch);
export const useCurrentBranchId = () => useBranchStore((state) => state.currentBranchId);
export const useBranchLoading = () => useBranchStore((state) => state.isLoading);
export const useBranchError = () => useBranchStore((state) => state.error);

// Get current branch object
export const useCurrentBranch = () => 
  useBranchStore((state) => 
    state.branches.find((b) => b.id === state.currentBranchId) || null
  );
