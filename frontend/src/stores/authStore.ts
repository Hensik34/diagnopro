import { create } from 'zustand';
import { authApi, setAuthToken, getAuthToken } from '../api';
import type { User, LoginCredentials, DoctorProfile, LoginBranch } from '../types';
import { resetAllStores } from './resetStores';
import { useBranchStore } from './branchStore';
import {
  checkRolePermission,
  checkRolePermissionAny,
  checkRolePermissionAll,
  PERMISSIONS,
  type Permission
} from '../utils/permissions';

const syncActiveBranch = (branches?: LoginBranch[], defaultBranchId?: string, userRole?: string) => {
  const isStaffMultiBranch = userRole === 'staff' && branches && branches.length > 1;

  if (isStaffMultiBranch) {
    localStorage.removeItem('diagnopro_active_branch');
    useBranchStore.getState().setCurrentBranchId(null);
    return;
  }

  const targetId = branches?.[0]?.id || defaultBranchId;
  if (targetId) {
    localStorage.setItem('diagnopro_active_branch', targetId);
    useBranchStore.getState().setCurrentBranchId(targetId);
  }
};

// ==========================================
// Auth Store State Interface
// ==========================================

interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthState {
  // State
  user: User | null;
  staffList: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  doctorProfile: DoctorProfile | null;
  loginBranches: LoginBranch[];
  pendingEmail: string | null;
  pendingOtpVerification: boolean;

  login: (credentials: LoginCredentials) => Promise<{ success: boolean; requiresOtp?: boolean; email?: string }>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; requiresOtp?: boolean; email?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; requiresOtp?: boolean; email?: string }>;
  verifyLoginOtp: (otp: string) => Promise<boolean>;
  resendLoginOtp: () => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  fetchStaffList: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;

  // Role helpers
  getBranchRole: () => string | undefined;

  // RBAC Permission Checks
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
}

// ==========================================
// Auth Store Implementation
// ==========================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  user: null,
  staffList: [],
  isAuthenticated: !!getAuthToken(),
  isLoading: false,
  error: null,
  doctorProfile: null,
  loginBranches: [],
  pendingEmail: null,
  pendingOtpVerification: false,

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Login with email and password
   * Stores token in localStorage, user data in Zustand
   * Handles both user and doctor login responses
   */
  login: async (credentials: LoginCredentials): Promise<{ success: boolean; requiresOtp?: boolean; email?: string }> => {
    set({ isLoading: true, error: null, pendingEmail: null, pendingOtpVerification: false });

    try {
      const response = await authApi.login(credentials);

      if (response.requiresOtp) {
        set({
          pendingEmail: response.email || null,
          pendingOtpVerification: true,
          isLoading: false,
          error: null,
        });
        return { success: true, requiresOtp: true, email: response.email };
      }

      // Store token in localStorage
      if (response.token) {
        setAuthToken(response.token);
      }

      syncActiveBranch(response.branches, response.user?.branch_id, response.user?.role);

      // Store user in Zustand state
      set({
        user: response.user || null,
        staffList: [],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: response.doctorProfile || null,
        loginBranches: response.branches || [],
      });

      return { success: true, requiresOtp: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        staffList: [],
        doctorProfile: null,
        loginBranches: [],
        pendingEmail: null,
        pendingOtpVerification: false,
      });
      return { success: false };
    }
  },

  /**
   * Login or Register with Google ID Token
   */
  googleLogin: async (idToken: string): Promise<{ success: boolean; requiresOtp?: boolean; email?: string }> => {
    set({ isLoading: true, error: null, pendingEmail: null, pendingOtpVerification: false });

    try {
      const response = await authApi.googleLogin(idToken);

      if (response.requiresOtp) {
        set({
          pendingEmail: response.email || null,
          pendingOtpVerification: true,
          isLoading: false,
          error: null,
        });
        return { success: true, requiresOtp: true, email: response.email };
      }

      // Store token in localStorage
      if (response.token) {
        setAuthToken(response.token);
      }

      syncActiveBranch(response.branches, response.user?.branch_id, response.user?.role);

      // Store user in Zustand state
      set({
        user: response.user || null,
        staffList: [],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: response.doctorProfile || null,
        loginBranches: response.branches || [],
      });

      return { success: true, requiresOtp: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        staffList: [],
        doctorProfile: null,
        loginBranches: [],
        pendingEmail: null,
        pendingOtpVerification: false,
      });
      return { success: false };
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<{ success: boolean; requiresOtp?: boolean; email?: string }> => {
    set({ isLoading: true, error: null, pendingEmail: null, pendingOtpVerification: false });

    try {
      const response = await authApi.register(data);

      if (response.requiresOtp) {
        set({
          pendingEmail: response.email || data.email,
          pendingOtpVerification: true,
          isLoading: false,
          error: null,
          user: null,
          isAuthenticated: false,
          doctorProfile: null,
          loginBranches: [],
        });
        return { success: true, requiresOtp: true, email: response.email || data.email };
      }

      // Store token in localStorage
      if (response.token) {
        setAuthToken(response.token);
      }

      syncActiveBranch(response.branches, response.user?.branch_id, response.user?.role);

      // Store user in Zustand state
      set({
        user: response.user,
        staffList: [],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: null,
        loginBranches: [],
        pendingEmail: null,
        pendingOtpVerification: false,
      });

      return { success: true, requiresOtp: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        staffList: [],
        doctorProfile: null,
        loginBranches: [],
        pendingEmail: null,
        pendingOtpVerification: false,
      });
      return { success: false };
    }
  },

  /**
   * Verify login 2FA OTP passcode
   */
  verifyLoginOtp: async (otp: string): Promise<boolean> => {
    const email = get().pendingEmail;
    if (!email) {
      set({ error: 'No pending login email found.' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await authApi.verifyLoginOtp(email, otp);

      // Store token in localStorage
      if (response.token) {
        setAuthToken(response.token);
      }

      syncActiveBranch(response.branches, response.user?.branch_id, response.user?.role);

      // Store user in Zustand state
      set({
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: response.doctorProfile || null,
        loginBranches: response.branches || [],
        pendingEmail: null,
        pendingOtpVerification: false,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  /**
   * Resend login 2FA OTP passcode
   */
  resendLoginOtp: async (): Promise<boolean> => {
    const email = get().pendingEmail;
    if (!email) {
      set({ error: 'No pending login email found.' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await authApi.resendLoginOtp(email);
      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resending passcode failed';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  /**
   * Logout - Clear token and user data
   */
  logout: () => {
    // 1. Clear auth state first (stops any in-flight API calls from re-populating)
    set({
      user: null,
      staffList: [],
      isAuthenticated: false,
      error: null,
      doctorProfile: null,
      loginBranches: [],
      pendingEmail: null,
      pendingOtpVerification: false,
    });

    // 2. Clear all localStorage items (tokens, active branch, session keys)
    localStorage.clear();

    // 3. Reset ALL stores SYNCHRONOUSLY
    resetAllStores();
  },

  /**
   * Fetch current user profile from API
   */
  fetchProfile: async () => {
    if (!getAuthToken()) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await authApi.getProfile();
      syncActiveBranch(response.branches, response.data?.branch_id);
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token is invalid — treat as a forced logout.
      // Reset everything to prevent data leaks.
      set({
        user: null,
        staffList: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
        doctorProfile: null,
        loginBranches: [],
      });
      resetAllStores();
    }
  },

  /**
   * Fetch active users in current organization for selection dropdowns
   */
  fetchStaffList: async () => {
    if (!getAuthToken()) {
      set({ staffList: [] });
      return;
    }

    try {
      const response = await authApi.getUsersForSelection();
      set({ staffList: response.data || [] });
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
      set({ staffList: [] });
    }
  },

  /**
   * Clear any error messages
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Initialize auth state on app load
   * Check if token exists and fetch user profile
   */
  initialize: async () => {
    const token = getAuthToken();

    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    // Token exists, try to fetch profile
    await get().fetchProfile();
  },

  /**
   * Get the current user's role (used for branch-specific role checks)
   * Returns the user's role from the stored user object
   */
  getBranchRole: (): string | undefined => {
    return get().user?.role;
  },

  // ==========================================
  // RBAC Permission Checks
  // ==========================================

  /**
   * Check if current user has a specific permission
   * @param permission - The permission to check (e.g., 'report:approve')
   * @returns boolean
   * 
   * @example
   * const { can } = useAuthStore();
   * if (can('report:approve')) { ... }
   */
  can: (permission: string): boolean => {
    const user = get().user;
    if (permission === 'report:approve') {
      return (user?.role === 'admin') || (user?.role === 'lab_technician' && user?.can_approve_reports === true);
    }
    return checkRolePermission(user?.role, permission);
  },

  /**
   * Check if current user has ANY of the specified permissions
   */
  canAny: (permissions: string[]): boolean => {
    const user = get().user;
    return checkRolePermissionAny(user?.role, permissions);
  },

  /**
   * Check if current user has ALL of the specified permissions
   */
  canAll: (permissions: string[]): boolean => {
    const user = get().user;
    return checkRolePermissionAll(user?.role, permissions);
  },
}));

// ==========================================
// Selector Hooks for Performance
// ==========================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useDoctorProfile = () => useAuthStore((state) => state.doctorProfile);
export const useLoginBranches = () => useAuthStore((state) => state.loginBranches);
export const usePendingEmail = () => useAuthStore((state) => state.pendingEmail);
export const usePendingOtpVerification = () => useAuthStore((state) => state.pendingOtpVerification);

// ==========================================
// RBAC Permission Hooks
// ==========================================

/**
 * Hook to check a single permission
 * @example
 * const canApprove = useCan('report:approve');
 * {canApprove && <ApproveButton />}
 */
export const useCan = (permission: string) => useAuthStore((state) => state.can(permission));

/**
 * Hook to check multiple permissions (ANY)
 * @example
 * const canManageReports = useCanAny(['report:create', 'report:update']);
 */
export const useCanAny = (permissions: string[]) => useAuthStore((state) => state.canAny(permissions));

/**
 * Hook to check multiple permissions (ALL)
 * @example
 * const isFullAdmin = useCanAll(['user:create', 'user:delete']);
 */
export const useCanAll = (permissions: string[]) => useAuthStore((state) => state.canAll(permissions));

/**
 * Hook to get user's role
 * @example
 * const role = useUserRole();
 */
export const useUserRole = () => useAuthStore((state) => state.user?.role);

// Re-export PERMISSIONS for convenience
export { PERMISSIONS } from '../utils/permissions';
