import { create } from 'zustand';
import { timeLogApi } from '../api/timeLogs';
import type { TimeLog, UserTimeSummary } from '../api/timeLogs';
import { useBranchStore } from './branchStore';

interface TimeLogState {
  // State
  activeSession: TimeLog | null;
  myLogs: TimeLog[];
  myTotalHours: number;
  allLogs: TimeLog[];
  userSummary: UserTimeSummary[];
  totalHoursAll: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  clockIn: (branchId?: string) => Promise<boolean>;
  clockOut: (notes?: string) => Promise<boolean>;
  fetchActiveSession: () => Promise<void>;
  fetchMyLogs: (startDate?: string, endDate?: string, branchId?: string) => Promise<void>;
  fetchAllLogs: (startDate?: string, endDate?: string, branchId?: string) => Promise<void>;
  fetchUserSummary: (startDate?: string, endDate?: string, branchId?: string) => Promise<void>;
  fetchUserLogs: (userId: string, startDate?: string, endDate?: string, branchId?: string) => Promise<TimeLog[]>;
  deleteLog: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useTimeLogStore = create<TimeLogState>((set, get) => ({
  activeSession: null,
  myLogs: [],
  myTotalHours: 0,
  allLogs: [],
  userSummary: [],
  totalHoursAll: 0,
  isLoading: false,
  error: null,

  clockIn: async (branchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const activeBranchId = branchId || useBranchStore.getState().currentBranchId || undefined;
      const res = await timeLogApi.clockIn(activeBranchId);
      set({ activeSession: res.data, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Clock in failed', isLoading: false });
      return false;
    }
  },

  clockOut: async (notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      await timeLogApi.clockOut(notes);
      set({ activeSession: null, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Clock out failed', isLoading: false });
      return false;
    }
  },

  fetchActiveSession: async () => {
    try {
      const res = await timeLogApi.getActiveSession();
      set({ activeSession: res.data });
    } catch (err) {
      // Silently fail - no active session
      set({ activeSession: null });
    }
  },

  fetchMyLogs: async (startDate?: string, endDate?: string, branchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const activeBranchId = branchId || useBranchStore.getState().currentBranchId || undefined;
      const res = await timeLogApi.getMyLogs(startDate, endDate, activeBranchId);
      set({ myLogs: res.data, myTotalHours: res.total_hours, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch logs', isLoading: false });
    }
  },

  fetchAllLogs: async (startDate?: string, endDate?: string, branchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const activeBranchId = branchId || useBranchStore.getState().currentBranchId || undefined;
      const res = await timeLogApi.getAllLogs(startDate, endDate, activeBranchId);
      set({ allLogs: res.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch logs', isLoading: false });
    }
  },

  fetchUserSummary: async (startDate?: string, endDate?: string, branchId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const activeBranchId = branchId || useBranchStore.getState().currentBranchId || undefined;
      const res = await timeLogApi.getUserSummary(startDate, endDate, activeBranchId);
      set({ userSummary: res.data, totalHoursAll: res.total_hours_all, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch summary', isLoading: false });
    }
  },

  fetchUserLogs: async (userId: string, startDate?: string, endDate?: string, branchId?: string) => {
    try {
      const activeBranchId = branchId || useBranchStore.getState().currentBranchId || undefined;
      const res = await timeLogApi.getUserLogs(userId, startDate, endDate, activeBranchId);
      return res.data;
    } catch {
      return [];
    }
  },

  deleteLog: async (id: string) => {
    try {
      await timeLogApi.deleteLog(id);
      // Refresh lists
      set((state) => ({
        allLogs: state.allLogs.filter((l) => l.id !== id),
        myLogs: state.myLogs.filter((l) => l.id !== id),
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete' });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    activeSession: null,
    myLogs: [],
    myTotalHours: 0,
    allLogs: [],
    userSummary: [],
    totalHoursAll: 0,
    isLoading: false,
    error: null,
  }),
}));

// Selector hooks
export const useActiveSession = () => useTimeLogStore((s) => s.activeSession);
export const useTimeLogLoading = () => useTimeLogStore((s) => s.isLoading);
export const useTimeLogError = () => useTimeLogStore((s) => s.error);
