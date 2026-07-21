import { create } from 'zustand';
import { doctorApi } from '../api';
import type { Doctor, CreateDoctorData } from '../types';

// ==========================================
// Doctor Store State Interface
// ==========================================

interface DoctorState {
  // State
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  isLoading: boolean;
  error: string | null;
  currentBranchId: string | null;

  // Actions
  fetchDoctors: (params?: { branch_id?: string }) => Promise<void>;
  fetchDoctorById: (id: string) => Promise<void>;
  createDoctor: (data: CreateDoctorData) => Promise<Doctor | null>;
  updateDoctor: (id: string, data: Partial<CreateDoctorData>) => Promise<Doctor | null>;
  deleteDoctor: (id: string) => Promise<boolean>;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState = {
  doctors: [],
  selectedDoctor: null,
  isLoading: false,
  error: null,
  currentBranchId: null,
};

// ==========================================
// Doctor Store Implementation
// ==========================================

export const useDoctorStore = create<DoctorState>((set) => ({
  ...initialState,

  /**
   * Fetch all doctors, optionally filtered by branch
   */
  fetchDoctors: async (params?: { branch_id?: string }) => {
    set({ isLoading: true, error: null, currentBranchId: params?.branch_id || null });
    
    try {
      const response = await doctorApi.getAll(params);
      set({
        doctors: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doctors';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch single doctor by ID
   */
  fetchDoctorById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await doctorApi.getById(id);
      set({
        selectedDoctor: response.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doctor';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Create new doctor
   */
  createDoctor: async (data: CreateDoctorData): Promise<Doctor | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await doctorApi.create(data);
      const newDoctor = response.data;
      
      set((state) => ({
        doctors: [newDoctor, ...state.doctors],
        isLoading: false,
      }));
      
      return newDoctor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create doctor';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update doctor
   */
  updateDoctor: async (id: string, data: Partial<CreateDoctorData>): Promise<Doctor | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await doctorApi.update(id, data);
      const updatedDoctor = response.data;
      
      set((state) => ({
        doctors: state.doctors.map((d) => 
          d.id === id ? updatedDoctor : d
        ),
        selectedDoctor: state.selectedDoctor?.id === id 
          ? updatedDoctor 
          : state.selectedDoctor,
        isLoading: false,
      }));
      
      return updatedDoctor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update doctor';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  /**
   * Delete doctor
   */
  deleteDoctor: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      await doctorApi.delete(id);
      
      set((state) => ({
        doctors: state.doctors.filter((d) => d.id !== id),
        selectedDoctor: state.selectedDoctor?.id === id 
          ? null 
          : state.selectedDoctor,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete doctor';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  /**
   * Set selected doctor
   */
  setSelectedDoctor: (doctor: Doctor | null) => {
    set({ selectedDoctor: doctor });
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

export const useDoctors = () => useDoctorStore((state) => state.doctors);
export const useSelectedDoctor = () => useDoctorStore((state) => state.selectedDoctor);
export const useDoctorLoading = () => useDoctorStore((state) => state.isLoading);
export const useDoctorError = () => useDoctorStore((state) => state.error);
