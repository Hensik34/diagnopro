import api from './client';

export interface TimeLog {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (from admin endpoints)
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
}

export interface UserTimeSummary {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  total_sessions: number;
  total_hours: number;
  first_clock_in: string | null;
  last_clock_out: string | null;
}

export const timeLogApi = {
  // Clock in
  clockIn: async (): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post('/time-logs/clock-in');
    return response.data;
  },

  // Clock out
  clockOut: async (notes?: string): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post('/time-logs/clock-out', { notes });
    return response.data;
  },

  // Get active session
  getActiveSession: async (): Promise<{ data: TimeLog | null }> => {
    const response = await api.get('/time-logs/active');
    return response.data;
  },

  // Get my logs
  getMyLogs: async (startDate?: string, endDate?: string): Promise<{ 
    count: number; total_hours: number; data: TimeLog[] 
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/time-logs/my-logs?${params.toString()}`);
    return response.data;
  },

  // Admin: get all logs
  getAllLogs: async (startDate?: string, endDate?: string): Promise<{
    count: number; data: TimeLog[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/time-logs/all?${params.toString()}`);
    return response.data;
  },

  // Admin: get user summary
  getUserSummary: async (startDate?: string, endDate?: string): Promise<{
    total_users: number; total_hours_all: number; data: UserTimeSummary[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/time-logs/summary?${params.toString()}`);
    return response.data;
  },

  // Admin: get specific user's logs
  getUserLogs: async (userId: string, startDate?: string, endDate?: string): Promise<{
    count: number; total_hours: number; data: TimeLog[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/time-logs/user/${userId}?${params.toString()}`);
    return response.data;
  },

  // Admin: delete a log
  deleteLog: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/time-logs/${id}`);
    return response.data;
  },
};
