import api from './client';

// ==========================================
// Doctor Portal API Endpoints
// ==========================================

export interface DoctorDashboardData {
  doctor: {
    id: string;
    name: string;
    specialization: string;
    commission_percentage: number;
  };
  allTime: {
    total_reports: number;
    total_patients: number;
    total_revenue: number;
    total_commission: number;
    approved_reports: number;
    pending_reports: number;
  };
  thisMonth: {
    reports: number;
    revenue: number;
    commission: number;
  };
  recentReports: Array<{
    id: string;
    status: string;
    report_amount: number;
    doctor_commission: number;
    created_at: string;
    patient_name: string;
    patient_phone: string;
  }>;
}

export interface DoctorPortalReport {
  id: string;
  patient_id: string;
  doctor_id: string;
  report_type: string;
  status: string;
  report_amount: number;
  doctor_commission: number;
  is_self_report: boolean;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_phone: string;
  patient_gender: string;
  patient_age: number;
  technician_firstname: string;
  technician_lastname: string;
  sample_id_code: string;
  sample_type: string;
  test_data: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const doctorPortalApi = {
  /**
   * Get dashboard stats for logged-in doctor
   */
  getDashboard: async (): Promise<{ data: DoctorDashboardData }> => {
    const response = await api.get<{ message: string; data: DoctorDashboardData }>('/doctor-portal/dashboard');
    return response.data;
  },

  /**
   * Get reports referred by this doctor
   */
  getMyReports: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<{ data: DoctorPortalReport[]; pagination: Pagination }> => {
    const response = await api.get<{ 
      message: string; 
      data: DoctorPortalReport[]; 
      pagination: Pagination 
    }>('/doctor-portal/reports', { params });
    return response.data;
  },

  /**
   * Get doctor's own profile
   */
  getMyProfile: async (): Promise<{ data: any }> => {
    const response = await api.get<{ message: string; data: any }>('/doctor-portal/profile');
    return response.data;
  },

  /**
   * Get commission statement for date range
   */
  getMyStatement: async (startDate: string, endDate: string): Promise<{ data: any }> => {
    const response = await api.get<{ message: string; data: any }>('/doctor-portal/statement', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },
};
