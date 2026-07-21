import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ==========================================
// API Configuration
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// Request Interceptor - Add auth token
// ==========================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    const activeBranchId = localStorage.getItem('diagnopro_active_branch');

    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (activeBranchId) {
        config.headers['x-branch-id'] = activeBranchId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor - Handle errors
// ==========================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                             requestUrl.includes('/auth/verify-otp') ||
                             requestUrl.includes('/auth/register') ||
                             requestUrl.includes('/auth/google-login');

      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' ||
                         currentPath === '/verify-otp' ||
                         currentPath === '/register';

      // Only perform forced logout redirect if it's NOT an auth endpoint and NOT on auth pages
      if (!isAuthEndpoint && !isAuthPage) {
        localStorage.clear();
        import('../stores/resetStores').then(({ resetAllStores }) => {
          resetAllStores();
        });
        window.location.href = '/login';
      }
    }

    // Extract error message from response
    const errorMessage =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// ==========================================
// API Helper Functions
// ==========================================

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorMessage =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;

