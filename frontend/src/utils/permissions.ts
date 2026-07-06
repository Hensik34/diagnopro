/**
 * ============================================
 * CENTRALIZED RBAC PERMISSION CONFIGURATION
 * ============================================
 * 
 * Frontend permission system that mirrors the backend config.
 * Single source of truth for permission checks in React components.
 * 
 * Usage:
 *   import { can, PERMISSIONS } from '@/utils/permissions';
 *   
 *   // In components
 *   {can('report:approve') && <ApproveButton />}
 *   
 *   // Or with permission constant
 *   {can(PERMISSIONS.REPORT_APPROVE) && <ApproveButton />}
 */

import type { User } from '../types';

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

/**
 * All available permissions in the system
 * Must match backend /config/permissions.js
 */
export const PERMISSIONS = {
  // Patient Management
  PATIENT_CREATE: 'patient:create',
  PATIENT_READ: 'patient:read',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_DELETE: 'patient:delete',

  // Report Management
  REPORT_CREATE: 'report:create',
  REPORT_READ: 'report:read',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  REPORT_APPROVE: 'report:approve',
  REPORT_DOWNLOAD: 'report:download',
  REPORT_ASSIGN_TECHNICIAN: 'report:assign_technician',
  REPORT_REVIEW: 'report:review',

  // Sample Management
  SAMPLE_CREATE: 'sample:create',
  SAMPLE_READ: 'sample:read',
  SAMPLE_UPDATE: 'sample:update',
  SAMPLE_DELETE: 'sample:delete',
  SAMPLE_COLLECT: 'sample:collect',

  // Test Management
  TEST_CREATE: 'test:create',
  TEST_READ: 'test:read',
  TEST_UPDATE: 'test:update',
  TEST_DELETE: 'test:delete',
  TEST_RESULT_UPDATE: 'test:result_update',

  // Branch Management
  BRANCH_CREATE: 'branch:create',
  BRANCH_READ: 'branch:read',
  BRANCH_UPDATE: 'branch:update',
  BRANCH_DELETE: 'branch:delete',
  BRANCH_ASSIGN_USER: 'branch:assign_user',

  // Doctor Management
  DOCTOR_CREATE: 'doctor:create',
  DOCTOR_READ: 'doctor:read',
  DOCTOR_UPDATE: 'doctor:update',
  DOCTOR_DELETE: 'doctor:delete',
  DOCTOR_COMMISSION_VIEW: 'doctor:commission_view',

  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Collection Tracking
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_READ: 'collection:read',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_ADMIN: 'collection:admin',

  // Inventory Management
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',

  // Time Log Management
  TIMELOG_VIEW_ALL: 'timelog:view_all',
  TIMELOG_DELETE: 'timelog:delete',
  TIMELOG_TRACK: 'timelog:track',

  // Settings & System
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  ANALYTICS_VIEW: 'analytics:view',
  AUDIT_LOG_VIEW: 'audit:view',

  // B2B Lab Management
  B2B_LAB_CREATE: 'b2b:lab_create',
  B2B_LAB_READ: 'b2b:lab_read',
  B2B_LAB_UPDATE: 'b2b:lab_update',
  B2B_LAB_DELETE: 'b2b:lab_delete',
  B2B_ORDER_CREATE: 'b2b:order_create',
  B2B_ORDER_READ: 'b2b:order_read',
  B2B_ORDER_UPDATE: 'b2b:order_update',
  B2B_REPORT_UPLOAD: 'b2b:report_upload',
  B2B_REPORT_APPROVE: 'b2b:report_approve',
  B2B_REPORT_RELEASE: 'b2b:report_release',
  B2B_REPORT_DOWNLOAD: 'b2b:report_download',
  B2B_PAYMENT_CREATE: 'b2b:payment_create',
  B2B_PAYMENT_READ: 'b2b:payment_read',
  B2B_PAYMENT_DELETE: 'b2b:payment_delete',
  B2B_DASHBOARD_VIEW: 'b2b:dashboard_view',
  B2B_AUDIT_VIEW: 'b2b:audit_view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ==========================================
// ROLE DEFINITIONS
// ==========================================

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  TECHNICIAN: 'lab_technician',
  STAFF: 'staff',
  B2B_LAB: 'b2b_lab',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ==========================================
// ROLE-PERMISSION MAPPING
// ==========================================

/**
 * Maps each role to its allowed permissions
 * '*' = wildcard (all permissions)
 * 
 * NOTE: Must be kept in sync with backend /config/permissions.js
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Admin has full access to everything
  [ROLES.ADMIN]: ['*'],

  // Doctor: Can view patients, reports, create reports, view commissions (no review access)
  [ROLES.DOCTOR]: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.DOCTOR_COMMISSION_VIEW,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.INVENTORY_READ,
  ],

  // Lab Technician: Sample collection, test processing, report creation and review
  [ROLES.TECHNICIAN]: [
    // Patient Management - full access
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_DELETE,

    // Report Management - all except delete
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_APPROVE,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.REPORT_ASSIGN_TECHNICIAN,

    // Sample Management - full access
    PERMISSIONS.SAMPLE_CREATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_UPDATE,
    PERMISSIONS.SAMPLE_DELETE,
    PERMISSIONS.SAMPLE_COLLECT,

    // Test Management - full access
    PERMISSIONS.TEST_CREATE,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.TEST_UPDATE,
    PERMISSIONS.TEST_DELETE,
    PERMISSIONS.TEST_RESULT_UPDATE,

    // Branch Management - read only (branches is excluded from all rights)
    PERMISSIONS.BRANCH_READ,

    // Inventory Management - full access
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,

    // Collection Tracking
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,

    // Settings - can manage WhatsApp and notifications
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,

    // Doctor Management - full access
    PERMISSIONS.DOCTOR_CREATE,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.DOCTOR_UPDATE,
    PERMISSIONS.DOCTOR_DELETE,
    PERMISSIONS.DOCTOR_COMMISSION_VIEW,

    // B2B Lab Management - full access
    PERMISSIONS.B2B_LAB_CREATE,
    PERMISSIONS.B2B_LAB_READ,
    PERMISSIONS.B2B_LAB_UPDATE,
    PERMISSIONS.B2B_LAB_DELETE,
    PERMISSIONS.B2B_ORDER_CREATE,
    PERMISSIONS.B2B_ORDER_READ,
    PERMISSIONS.B2B_ORDER_UPDATE,
    PERMISSIONS.B2B_REPORT_UPLOAD,
    PERMISSIONS.B2B_REPORT_APPROVE,
    PERMISSIONS.B2B_REPORT_RELEASE,
    PERMISSIONS.B2B_REPORT_DOWNLOAD,
    PERMISSIONS.B2B_PAYMENT_CREATE,
    PERMISSIONS.B2B_PAYMENT_READ,
    PERMISSIONS.B2B_PAYMENT_DELETE,
    PERMISSIONS.B2B_DASHBOARD_VIEW,
    PERMISSIONS.B2B_AUDIT_VIEW,
    PERMISSIONS.TIMELOG_TRACK,
  ],

  // Staff: Front desk operations - patient registration, report generation, basic reads, sample collection
  [ROLES.STAFF]: [
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.SAMPLE_CREATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_COLLECT,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.INVENTORY_READ,
    // Collection Tracking
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,
    // Settings - can manage WhatsApp and notifications
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.TIMELOG_TRACK,
  ],

  // B2B Lab: Partner lab with restricted access to own data
  [ROLES.B2B_LAB]: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.B2B_ORDER_CREATE,
    PERMISSIONS.B2B_ORDER_READ,
    PERMISSIONS.B2B_REPORT_DOWNLOAD,
    PERMISSIONS.B2B_DASHBOARD_VIEW,
    PERMISSIONS.B2B_PAYMENT_READ,
  ],
};

// ==========================================
// PERMISSION CHECK FUNCTIONS
// ==========================================

/**
 * Check if a role has a specific permission
 * 
 * @param role - The user's role
 * @param permission - The permission to check
 * @returns boolean
 * 
 * @example
 * checkRolePermission('doctor', 'report:approve') // true
 * checkRolePermission('staff', 'patient:delete') // false
 */
export function checkRolePermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Wildcard check (admin)
  if (permissions.includes('*')) return true;

  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function checkRolePermissionAny(role: string | undefined, permissions: string[]): boolean {
  return permissions.some(p => checkRolePermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function checkRolePermissionAll(role: string | undefined, permissions: string[]): boolean {
  return permissions.every(p => checkRolePermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

// ==========================================
// PERMISSION GROUPS (for UI organization)
// ==========================================

export const PERMISSION_GROUPS = {
  'Patient Management': [
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_DELETE,
  ],
  'Report Management': [
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DELETE,
    PERMISSIONS.REPORT_APPROVE,
    PERMISSIONS.REPORT_DOWNLOAD,
  ],
  'Sample Management': [
    PERMISSIONS.SAMPLE_CREATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_UPDATE,
    PERMISSIONS.SAMPLE_DELETE,
    PERMISSIONS.SAMPLE_COLLECT,
  ],
  'Test Management': [
    PERMISSIONS.TEST_CREATE,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.TEST_UPDATE,
    PERMISSIONS.TEST_DELETE,
  ],
  'Branch Management': [
    PERMISSIONS.BRANCH_CREATE,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_UPDATE,
    PERMISSIONS.BRANCH_DELETE,
  ],
  'Doctor Management': [
    PERMISSIONS.DOCTOR_CREATE,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.DOCTOR_UPDATE,
    PERMISSIONS.DOCTOR_DELETE,
    PERMISSIONS.DOCTOR_COMMISSION_VIEW,
  ],
  'User Management': [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  'Collection Tracking': [
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,
    PERMISSIONS.COLLECTION_ADMIN,
  ],
  'System': [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// ==========================================
// ROLE DISPLAY HELPERS
// ==========================================

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.TECHNICIAN]: 'Lab Technician',
  [ROLES.STAFF]: 'Staff',
  [ROLES.B2B_LAB]: 'B2B Partner Lab',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}
