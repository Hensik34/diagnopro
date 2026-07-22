import api from './client';

export interface LocationMetaPayload {
  lat?: number | null;
  lng?: number | null;
  verified?: boolean;
  distance_meters?: number;
  message?: string;
  timestamp?: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  start_km?: number | null;
  end_km?: number | null;
  total_km?: number | null;
  start_meter_image?: string | null;
  end_meter_image?: string | null;
  approval_status?: 'approved' | 'pending' | 'rejected' | 'rejected_with_penalty' | string;
  is_outside?: boolean;
  outside_reason?: string | null;
  rejection_note?: string | null;
  penalty_hours?: number;
  approved_by?: string | null;
  approved_at?: string | null;
  requested_clock_in?: string | null;
  requested_clock_out?: string | null;
  location_meta?: {
    clock_in?: LocationMetaPayload;
    clock_out?: LocationMetaPayload;
  } | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
  };
}

export interface UserTimeSummary {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  petrol_price_per_km?: number;
  total_sessions: number;
  total_hours: number;
  total_km?: number;
  total_penalty_hours?: number;
  first_clock_in: string | null;
  last_clock_out: string | null;
}

export const timeLogApi = {
  // Checkin
  clockIn: async (data?: {
    branchId?: string;
    start_km?: number;
    start_meter_image?: string;
    latitude?: number;
    longitude?: number;
    is_outside?: boolean;
    outside_reason?: string;
  }): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post('/time-logs/clock-in', {
      branch_id: data?.branchId,
      start_km: data?.start_km,
      start_meter_image: data?.start_meter_image,
      latitude: data?.latitude,
      longitude: data?.longitude,
      is_outside: data?.is_outside,
      outside_reason: data?.outside_reason,
    });
    return response.data;
  },

  // Checkout
  clockOut: async (data?: {
    notes?: string;
    end_km?: number;
    end_meter_image?: string;
    latitude?: number;
    longitude?: number;
    is_outside?: boolean;
    outside_reason?: string;
  }): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post('/time-logs/clock-out', {
      notes: data?.notes,
      end_km: data?.end_km,
      end_meter_image: data?.end_meter_image,
      latitude: data?.latitude,
      longitude: data?.longitude,
      is_outside: data?.is_outside,
      outside_reason: data?.outside_reason,
    });
    return response.data;
  },

  // Get active session
  getActiveSession: async (): Promise<{ data: TimeLog | null }> => {
    const response = await api.get('/time-logs/active');
    return response.data;
  },

  // Get my logs
  getMyLogs: async (startDate?: string, endDate?: string, branchId?: string): Promise<{ 
    count: number; total_hours: number; data: TimeLog[] 
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (branchId) params.append('branch_id', branchId);
    const response = await api.get(`/time-logs/my-logs?${params.toString()}`);
    return response.data;
  },

  // Admin: Get pending outside approvals
  getPendingApprovals: async (branchId?: string): Promise<{
    count: number; data: TimeLog[]
  }> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    const response = await api.get(`/time-logs/pending-approvals?${params.toString()}`);
    return response.data;
  },

  // Admin: Approve request
  approveClockRequest: async (id: string): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post(`/time-logs/${id}/approve`);
    return response.data;
  },

  // Admin: Reject request
  rejectClockRequest: async (id: string, rejection_note?: string): Promise<{ message: string; data: TimeLog }> => {
    const response = await api.post(`/time-logs/${id}/reject`, { rejection_note });
    return response.data;
  },

  // Admin: get all logs
  getAllLogs: async (startDate?: string, endDate?: string, branchId?: string): Promise<{
    count: number; data: TimeLog[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (branchId) params.append('branch_id', branchId);
    const response = await api.get(`/time-logs/all?${params.toString()}`);
    return response.data;
  },

  // Admin: get user summary
  getUserSummary: async (startDate?: string, endDate?: string, branchId?: string): Promise<{
    total_users: number; total_hours_all: number; data: UserTimeSummary[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (branchId) params.append('branch_id', branchId);
    const response = await api.get(`/time-logs/summary?${params.toString()}`);
    return response.data;
  },

  // Admin: get specific user's logs
  getUserLogs: async (userId: string, startDate?: string, endDate?: string, branchId?: string): Promise<{
    count: number; total_hours: number; data: TimeLog[]
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (branchId) params.append('branch_id', branchId);
    const response = await api.get(`/time-logs/user/${userId}?${params.toString()}`);
    return response.data;
  },

  // Admin: delete a log
  deleteLog: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/time-logs/${id}`);
    return response.data;
  },
};
