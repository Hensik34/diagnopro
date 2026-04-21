import { create } from 'zustand';
import { collectionTrackingApi } from '../api/collectionTracking';
import type {
  CollectionTracking,
  CreateCollectionTrackingData,
  CollectionTrackingFilters,
  CollectionSalarySummary,
  StaffListItem,
} from '../types';

interface CollectionTrackingState {
  records: CollectionTracking[];
  todayRecords: CollectionTracking[];
  myRecords: CollectionTracking[];
  staffList: StaffListItem[];
  summary: CollectionSalarySummary | null;
  isLoading: boolean;
  error: string | null;

  fetchRecords: (filters?: CollectionTrackingFilters) => Promise<void>;
  fetchToday: () => Promise<void>;
  fetchMyRecords: (filters?: { date_from?: string; date_to?: string }) => Promise<void>;
  fetchStaffList: () => Promise<void>;
  fetchSummary: (staffId: string, dateFrom: string, dateTo: string) => Promise<void>;
  createRecord: (data: CreateCollectionTrackingData) => Promise<CollectionTracking>;
  updateRecord: (id: string, data: Partial<CreateCollectionTrackingData>) => Promise<CollectionTracking>;
  deleteRecord: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCollectionTrackingStore = create<CollectionTrackingState>((set, get) => ({
  records: [],
  todayRecords: [],
  myRecords: [],
  staffList: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchRecords: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await collectionTrackingApi.getAll(filters);
      set({ records: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch records', isLoading: false });
    }
  },

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await collectionTrackingApi.getToday();
      set({ todayRecords: res.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch today records', isLoading: false });
    }
  },

  fetchMyRecords: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await collectionTrackingApi.getMyRecords(filters);
      set({ myRecords: res.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch your records', isLoading: false });
    }
  },

  fetchStaffList: async () => {
    try {
      const res = await collectionTrackingApi.getStaffList();
      set({ staffList: res.data });
    } catch (err: any) {
      console.error('Failed to fetch staff list:', err);
    }
  },

  fetchSummary: async (staffId, dateFrom, dateTo) => {
    try {
      const res = await collectionTrackingApi.getSummary(staffId, dateFrom, dateTo);
      set({ summary: res.data });
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
    }
  },

  createRecord: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await collectionTrackingApi.create(data);
      set((state) => ({
        records: [res.data, ...state.records],
        todayRecords: [res.data, ...state.todayRecords],
        myRecords: [res.data, ...state.myRecords],
        isLoading: false,
      }));
      return res.data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create record', isLoading: false });
      throw err;
    }
  },

  updateRecord: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await collectionTrackingApi.update(id, data);
      const updater = (r: CollectionTracking) => (r.id === id ? res.data : r);
      set((state) => ({
        records: state.records.map(updater),
        todayRecords: state.todayRecords.map(updater),
        myRecords: state.myRecords.map(updater),
        isLoading: false,
      }));
      return res.data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update record', isLoading: false });
      throw err;
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await collectionTrackingApi.delete(id);
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        todayRecords: state.todayRecords.filter((r) => r.id !== id),
        myRecords: state.myRecords.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete record', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selector hooks
export const useCollectionRecords = () => useCollectionTrackingStore((s) => s.records);
export const useTodayRecords = () => useCollectionTrackingStore((s) => s.todayRecords);
export const useMyRecords = () => useCollectionTrackingStore((s) => s.myRecords);
export const useCollectionLoading = () => useCollectionTrackingStore((s) => s.isLoading);
export const useCollectionError = () => useCollectionTrackingStore((s) => s.error);
