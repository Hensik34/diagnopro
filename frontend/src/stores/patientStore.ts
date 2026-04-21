import { create } from 'zustand';
import { patientApi } from '../api';
import type { Patient, CreatePatientData, PatientFilters } from '../types';

// ==========================================
// Patient Store State Interface
// ==========================================

interface PatientState {
  // State
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  filters: PatientFilters;

  // Actions
  fetchPatients: (filters?: PatientFilters) => Promise<void>;
  fetchPatientById: (id: string) => Promise<void>;
  createPatient: (data: CreatePatientData) => Promise<Patient | null>;
  updatePatient: (id: string, data: Partial<CreatePatientData>) => Promise<Patient | null>;
  deletePatient: (id: string) => Promise<boolean>;
  setSelectedPatient: (patient: Patient | null) => void;
  setFilters: (filters: PatientFilters) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  patients: [],
  selectedPatient: null,
  isLoading: false,
  error: null,
  filters: {},
};

// ==========================================
// Patient Store Implementation
// ==========================================

export const usePatientStore = create<PatientState>((set, get) => ({
  ...initialState,

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Fetch all patients with optional filters
   */
  fetchPatients: async (filters?: PatientFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const appliedFilters = filters || get().filters;
      const response = await patientApi.getAll(appliedFilters);
      
      set({
        patients: response.data,
        filters: appliedFilters,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single patient by ID
   */
  fetchPatientById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await patientApi.getById(id);
      set({
        selectedPatient: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patient';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new patient
   */
  createPatient: async (data: CreatePatientData): Promise<Patient | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await patientApi.create(data);
      const newPatient = response.data;
      
      // Add to local cache
      set((state) => ({
        patients: [newPatient, ...state.patients],
        isLoading: false,
      }));
      
      return newPatient;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create patient';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Update existing patient
   */
  updatePatient: async (id: string, data: Partial<CreatePatientData>): Promise<Patient | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await patientApi.update(id, data);
      const updatedPatient = response.data;
      
      // Update local cache
      set((state) => ({
        patients: state.patients.map((p) => 
          p.id === id ? updatedPatient : p
        ),
        selectedPatient: state.selectedPatient?.id === id 
          ? updatedPatient 
          : state.selectedPatient,
        isLoading: false,
      }));
      
      return updatedPatient;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update patient';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Delete patient
   */
  deletePatient: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      await patientApi.delete(id);
      
      // Remove from local cache
      set((state) => ({
        patients: state.patients.filter((p) => p.id !== id),
        selectedPatient: state.selectedPatient?.id === id 
          ? null 
          : state.selectedPatient,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete patient';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Set selected patient (for detail view)
   */
  setSelectedPatient: (patient: Patient | null) => {
    set({ selectedPatient: patient });
  },

  /**
   * Update filters
   */
  setFilters: (filters: PatientFilters) => {
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

export const usePatients = () => usePatientStore((state) => state.patients);
export const useSelectedPatient = () => usePatientStore((state) => state.selectedPatient);
export const usePatientLoading = () => usePatientStore((state) => state.isLoading);
export const usePatientError = () => usePatientStore((state) => state.error);
