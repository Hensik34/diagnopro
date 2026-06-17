import { create } from 'zustand';
import { branchApi } from '../api';
import type { Branch } from '../types';
import { resetDataStores } from './resetStores';

// ==========================================
// Branch Store State Interface
// ==========================================

// localStorage key for persisting the user's active branch across refreshes
const BRANCH_STORAGE_KEY = 'visionlab_active_branch';

interface BranchState {
  // State
  branches: Branch[];
  selectedBranch: Branch | null;
  currentBranchId: string | null; // User's active branch
  isSwitchingBranch: boolean; // True during branch switch (shows full-screen loader)
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<void>;
  createBranch: (data: Partial<Branch>) => Promise<Branch | null>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<Branch | null>;
  deleteBranch: (id: string) => Promise<boolean>;
  switchBranch: (branchId: string, navigate: (path: string) => void) => void;
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
  isSwitchingBranch: false,
  isLoading: false,
  error: null,
};

// ==========================================
// Branch Store Implementation
// ==========================================

export const useBranchStore = create<BranchState>((set, get) => ({
  ...initialState,

  /**
   * Fetch all branches
   * Auto-selects first branch if none is currently selected
   */
  fetchBranches: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await branchApi.getAll();
      const branches = response.data;
      const current = get().currentBranchId;

      // Try to restore persisted branch from localStorage
      const persisted = localStorage.getItem(BRANCH_STORAGE_KEY);
      const fromStorage = persisted && branches.some((b: Branch) => b.id === persisted) ? persisted : null;

      // Priority: current in-memory > persisted from storage > first branch
      const validCurrent = current && branches.some((b: Branch) => b.id === current);
      const selectedId = validCurrent
        ? current
        : fromStorage
          ? fromStorage
          : (branches.length > 0 ? branches[0].id : null);

      // Persist the resolved branch
      if (selectedId) {
        localStorage.setItem(BRANCH_STORAGE_KEY, selectedId);
      }

      set({
        branches,
        currentBranchId: selectedId,
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
   * Switch to a different branch — SaaS workspace-style.
   * 1. Shows full-screen loader overlay
   * 2. Resets all data stores (reports, patients, tests, etc.)
   * 3. Updates currentBranchId + persists to localStorage
   * 4. Navigates to Dashboard
   * 5. Hides loader after a brief delay (lets Dashboard re-mount)
   */
  switchBranch: (branchId: string, navigate: (path: string) => void) => {
    const current = get().currentBranchId;
    if (branchId === current) return; // Already on this branch

    // 1. Show switching overlay
    set({ isSwitchingBranch: true });

    // 2. Reset all data stores (keep auth & branch list intact)
    resetDataStores();

    // 3. Update branch + persist
    set({ currentBranchId: branchId });
    localStorage.setItem(BRANCH_STORAGE_KEY, branchId);

    // 4. Navigate to dashboard
    navigate('/');

    // 5. Hide overlay after a brief delay so Dashboard can re-mount with new data
    setTimeout(() => {
      set({ isSwitchingBranch: false });
    }, 800);
  },

  /**
   * Set current active branch
   */
  setCurrentBranchId: (branchId: string | null) => {
    set({ currentBranchId: branchId });
    if (branchId) {
      localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
    }
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
export const useIsSwitchingBranch = () => useBranchStore((state) => state.isSwitchingBranch);
export const useBranchLoading = () => useBranchStore((state) => state.isLoading);
export const useBranchError = () => useBranchStore((state) => state.error);

// Get current branch object
export const useCurrentBranch = () =>
  useBranchStore((state) =>
    state.branches.find((b) => b.id === state.currentBranchId) || null
  );
