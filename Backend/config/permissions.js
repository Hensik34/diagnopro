/**
 * ============================================
 * CENTRALIZED RBAC PERMISSION CONFIGURATION
 * ============================================
 * 
 * Single source of truth for all permissions and role mappings.
 * DO NOT scatter role checks anywhere in the codebase.
 * Always use the `can()` helper or `authorize()` middleware.
 * 
 * Permission naming convention: `resource:action`
 * Examples: patient:create, report:approve, sample:collect
 */

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

/**
 * All available permissions in the system
 * Grouped by module/resource for better organization
 */
const PERMISSIONS = {
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
  REPORT_REMOVE_TEST: 'report:remove_test',

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

  // Inventory Management
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',

  // Collection Tracking
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_READ: 'collection:read',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_ADMIN: 'collection:admin',

  // Time Log Management
  TIMELOG_VIEW_ALL: 'timelog:view_all',
  TIMELOG_DELETE: 'timelog:delete',
  TIMELOG_TRACK: 'timelog:track',

  // Settings & System
  SETTINGS_READ: 'settings:read',
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
};

// ==========================================
// ROLE DEFINITIONS
// ==========================================

/**
 * Available roles in the system
 */
const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATHOLOGIST: 'pathologist',
  TECHNICIAN: 'lab_technician',
  STAFF: 'staff',
  B2B_LAB: 'b2b_lab',
};

// ==========================================
// ROLE-PERMISSION MAPPING
// ==========================================

/**
 * Maps each role to its allowed permissions
 * '*' = wildcard (all permissions)
 * 
 * NOTE: This is the ONLY place where role-permission mapping should be defined.
 * To add a new permission to a role, add it here.
 */
const ROLE_PERMISSIONS = {
  // Admin has full access to everything
  [ROLES.ADMIN]: ['*'],

  // Doctor: Can view patients, reports, view commissions
  [ROLES.DOCTOR]: [
    // Patient - read only
    PERMISSIONS.PATIENT_READ,
    
    // Reports - view and download only
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DOWNLOAD,
    
    // Samples - read only
    PERMISSIONS.SAMPLE_READ,
    
    // Tests - read only
    PERMISSIONS.TEST_READ,
    
    // Doctor - view own commission only
    PERMISSIONS.DOCTOR_COMMISSION_VIEW,
    
    // Branch - read only (for data fetching)
    PERMISSIONS.BRANCH_READ,
    
    // Inventory - read
    PERMISSIONS.INVENTORY_READ,

    // Analytics - view
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  // Lab Technician (also does sample collection): Sample collection, test processing, report creation
  [ROLES.TECHNICIAN]: [
    // Patient Management - full access
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_DELETE,
    
    // Reports - create, update, read, download, approve (not delete)
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_APPROVE,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.REPORT_ASSIGN_TECHNICIAN,
    
    // Samples - full CRUD
    PERMISSIONS.SAMPLE_CREATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_UPDATE,
    PERMISSIONS.SAMPLE_DELETE,
    PERMISSIONS.SAMPLE_COLLECT,
    
    // Tests - full access
    PERMISSIONS.TEST_CREATE,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.TEST_UPDATE,
    PERMISSIONS.TEST_DELETE,
    PERMISSIONS.TEST_RESULT_UPDATE,

    // Branch - read only (branches is excluded from all rights)
    PERMISSIONS.BRANCH_READ,

    // Inventory - full access
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,

    // Collection Tracking - own records
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,

    // Settings - can manage WhatsApp and notifications
    PERMISSIONS.SETTINGS_READ,
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

  // Staff: Limited front desk operations - field patient creation, own logs, settings reading, KM tracking
  [ROLES.STAFF]: [
    // Patient Management
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,

    // Branch - read only (for data fetching)
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.SAMPLE_COLLECT,

    // Collection Tracking - own records
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,

    // Settings - can read settings for UI mapping
    PERMISSIONS.SETTINGS_READ,
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

  // MD Pathologist: Focused on report review & approval
  [ROLES.PATHOLOGIST]: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_APPROVE,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};

// ==========================================
// PERMISSION GROUPS (for UI organization)
// ==========================================

/**
 * Groups permissions by module for UI display
 * Useful for permission management screens
 */
const PERMISSION_GROUPS = {
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
    PERMISSIONS.REPORT_ASSIGN_TECHNICIAN,
    PERMISSIONS.REPORT_REMOVE_TEST,
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
    PERMISSIONS.TEST_RESULT_UPDATE,
  ],
  'Branch Management': [
    PERMISSIONS.BRANCH_CREATE,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_UPDATE,
    PERMISSIONS.BRANCH_DELETE,
    PERMISSIONS.BRANCH_ASSIGN_USER,
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
    PERMISSIONS.USER_MANAGE_ROLES,
  ],
  'Inventory Management': [
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
  ],
  'Collection Tracking': [
    PERMISSIONS.COLLECTION_CREATE,
    PERMISSIONS.COLLECTION_READ,
    PERMISSIONS.COLLECTION_UPDATE,
    PERMISSIONS.COLLECTION_ADMIN,
  ],
  'Time Tracking': [
    PERMISSIONS.TIMELOG_VIEW_ALL,
    PERMISSIONS.TIMELOG_DELETE,
  ],
  'System': [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  'B2B Lab Management': [
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
  ],
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
};
