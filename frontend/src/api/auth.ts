import api from './client';
import type {
  LoginCredentials,
  AuthResponse,
  User,
  ApiResponse,
} from '../types';

// ==========================================
// Auth API Endpoints
// ==========================================

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new admin user (self-registration)
   */
  register: async (userData: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  /**
   * Create a sub-user (admin creates staff/technician/doctor)
   */
  createUser: async (userData: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    petrol_price_per_km?: number;
    branch_id?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.post<{ message: string; user: User }>('/auth/users', userData);
    return response.data;
  },

  /**
   * Check if an email is already registered
   */
  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    const response = await api.get<{ exists: boolean }>('/auth/check-email', { params: { email } });
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/auth/password', data);
    return response.data;
  },

  // ==========================================
  // Admin User Management
  // ==========================================

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/auth/users');
    return response.data;
  },

  /**
   * Update a user (admin only)
   */
  updateUser: async (id: string, data: { firstname?: string; lastname?: string; phone?: string; role?: string; petrol_price_per_km?: number }): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/auth/users/${id}`, data);
    return response.data;
  },

  /**
   * Toggle user active/inactive status (admin only)
   */
  toggleUserStatus: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.patch<ApiResponse<User>>(`/auth/users/${id}/status`);
    return response.data;
  },
};
