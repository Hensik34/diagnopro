import { create } from 'zustand';
import { b2bApi } from '../api/b2b';
import type { B2BLab, CreateB2BLabData } from '../types/b2b';

// ==========================================
// B2B Store — Simplified Partner Labs Only
// ==========================================

interface B2BState {
  labs: B2BLab[];
  isLoading: boolean;
  error: string | null;

  fetchLabs: () => Promise<void>;
  createLab: (data: CreateB2BLabData) => Promise<B2BLab>;
  updateLab: (id: string, data: Partial<B2BLab>) => Promise<void>;
  deleteLab: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useB2BStore = create<B2BState>((set) => ({
  labs: [],
  isLoading: false,
  error: null,

  fetchLabs: async () => {
    set({ isLoading: true, error: null });
    try {
      const labs = await b2bApi.getLabs();
      set({ labs, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch labs' });
    }
  },

  createLab: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const lab = await b2bApi.createLab(data);
      set((s) => ({ labs: [lab, ...s.labs], isLoading: false }));
      return lab;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create lab';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  updateLab: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const lab = await b2bApi.updateLab(id, data);
      set((s) => ({
        labs: s.labs.map((l) => (l.id === id ? lab : l)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to update lab' });
      throw err;
    }
  },

  deleteLab: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await b2bApi.deleteLab(id);
      set((s) => ({ labs: s.labs.filter((l) => l.id !== id), isLoading: false }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to delete lab' });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    labs: [],
    isLoading: false,
    error: null,
  }),
}));

// Selector hooks
export const useB2BLabs = () => useB2BStore((s) => s.labs);
export const useB2BLoading = () => useB2BStore((s) => s.isLoading);
export const useB2BError = () => useB2BStore((s) => s.error);
