import { create } from 'zustand';
import { sampleApi } from '../api';
import type { Sample, CreateSampleData, SampleFilters } from '../types';

// ==========================================
// Sample Store State Interface
// ==========================================

interface SampleState {
  // State
  samples: Sample[];
  selectedSample: Sample | null;
  isLoading: boolean;
  error: string | null;
  filters: SampleFilters;

  // Actions
  fetchSamples: (filters?: SampleFilters) => Promise<void>;
  fetchSampleById: (id: string) => Promise<void>;
  fetchSamplesByPatient: (patientId: string) => Promise<void>;
  createSample: (data: CreateSampleData) => Promise<Sample | null>;
  updateSample: (id: string, data: Partial<CreateSampleData>) => Promise<Sample | null>;
  deleteSample: (id: string) => Promise<boolean>;
  setSelectedSample: (sample: Sample | null) => void;
  setFilters: (filters: SampleFilters) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  samples: [],
  selectedSample: null,
  isLoading: false,
  error: null,
  filters: {},
};

// ==========================================
// Sample Store Implementation
// ==========================================

export const useSampleStore = create<SampleState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Fetch all samples with optional filters
   */
  fetchSamples: async (filters?: SampleFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const appliedFilters = filters || get().filters;
      const response = await sampleApi.getAll(appliedFilters);
      
      set({
        samples: response.data,
        filters: appliedFilters,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch samples';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single sample by ID
   */
  fetchSampleById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sampleApi.getById(id);
      set({
        selectedSample: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sample';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch samples for a specific patient
   */
  fetchSamplesByPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sampleApi.getByPatient(patientId);
      set({
        samples: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patient samples';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new sample
   */
  createSample: async (data: CreateSampleData): Promise<Sample | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sampleApi.create(data);
      const newSample = response.data;
      
      // Add to local cache
      set((state) => ({
        samples: [newSample, ...state.samples],
        isLoading: false,
      }));
      
      return newSample;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create sample';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update existing sample
   */
  updateSample: async (id: string, data: Partial<CreateSampleData>): Promise<Sample | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sampleApi.update(id, data);
      const updatedSample = response.data;
      
      // Update local cache
      set((state) => ({
        samples: state.samples.map((s) => 
          s.id === id ? updatedSample : s
        ),
        selectedSample: state.selectedSample?.id === id 
          ? updatedSample 
          : state.selectedSample,
        isLoading: false,
      }));
      
      return updatedSample;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update sample';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Delete sample
   */
  deleteSample: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      await sampleApi.delete(id);
      
      // Remove from local cache
      set((state) => ({
        samples: state.samples.filter((s) => s.id !== id),
        selectedSample: state.selectedSample?.id === id 
          ? null 
          : state.selectedSample,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete sample';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Set selected sample (for detail view)
   */
  setSelectedSample: (sample: Sample | null) => {
    set({ selectedSample: sample });
  },

  /**
   * Update filters
   */
  setFilters: (filters: SampleFilters) => {
    set({ filters });
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

export const useSamples = () => useSampleStore((state) => state.samples);
export const useSelectedSample = () => useSampleStore((state) => state.selectedSample);
export const useSampleLoading = () => useSampleStore((state) => state.isLoading);
export const useSampleError = () => useSampleStore((state) => state.error);

// Status-based selectors
export const usePendingSamples = () => 
  useSampleStore((state) => state.samples.filter((s) => s.status === 'pending'));

export const useProcessingSamples = () => 
  useSampleStore((state) => state.samples.filter((s) => s.status === 'processing'));
