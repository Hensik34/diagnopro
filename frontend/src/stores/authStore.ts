import { create } from 'zustand';
import { authApi, setAuthToken, getAuthToken } from '../api';
import type { User, LoginCredentials, DoctorProfile, LoginBranch } from '../types';
import { resetAllStores } from './resetStores';
import {
  checkRolePermission,
  checkRolePermissionAny,
  checkRolePermissionAll,
  PERMISSIONS,
  type Permission
} from '../utils/permissions';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  doctorProfile: DoctorProfile | null;
  loginBranches: LoginBranch[];

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
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
  isAuthenticated: !!getAuthToken(),
  isLoading: false,
  error: null,
  doctorProfile: null,
  loginBranches: [],

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Login with email and password
   * Stores token in localStorage, user data in Zustand
   * Handles both user and doctor login responses
   */
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login(credentials);

      // Store token in localStorage (only token allowed)
      setAuthToken(response.token);

      // Store user in Zustand state (not localStorage)
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: response.doctorProfile || null,
        loginBranches: response.branches || [],
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        doctorProfile: null,
        loginBranches: [],
      });
      return false;
    }
  },

  /**
   * Login or Register with Google ID Token
   */
  googleLogin: async (idToken: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.googleLogin(idToken);

      // Store token in localStorage
      setAuthToken(response.token);

      // Store user in Zustand state
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: response.doctorProfile || null,
        loginBranches: response.branches || [],
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        doctorProfile: null,
        loginBranches: [],
      });
      return false;
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register(data);

      // Store token in localStorage
      setAuthToken(response.token);

      // Store user in Zustand state
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        doctorProfile: null,
        loginBranches: [],
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
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
      isAuthenticated: false,
      error: null,
      doctorProfile: null,
      loginBranches: [],
    });

    // 2. Reset ALL stores + clear user-scoped localStorage SYNCHRONOUSLY
    //    This prevents race conditions where a new user logs in before
    //    the old user's data is fully wiped.
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
