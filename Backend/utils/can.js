/**
 * ============================================
 * PERMISSION CHECK UTILITY
 * ============================================
 * 
 * Core function to check if a role has a specific permission.
 * Used internally by the authorize middleware and can be used
 * in controllers for fine-grained permission checks.
 */

const { ROLE_PERMISSIONS } = require('../config/permissions');

/**
 * Check if a role has a specific permission
 * 
 * @param {string} role - The user's role (e.g., 'admin', 'doctor')
 * @param {string} permission - The permission to check (e.g., 'patient:create')
 * @returns {boolean} - True if the role has the permission
 * 
 * @example
 * // Check if doctor can approve reports
 * can('doctor', 'report:approve') // true
 * 
 * // Check if staff can delete patients
 * can('staff', 'patient:delete') // false
 * 
 * // Admin has wildcard access
 * can('admin', 'anything:here') // true
 */
function can(role, permission, userFlags = {}) {
  // Handle missing role
  if (!role) {
    return false;
  }

  // Allow boolean shortcut for userFlags.can_approve_reports
  const canApproveReports = typeof userFlags === 'boolean' 
    ? userFlags 
    : userFlags?.can_approve_reports === true;

  if (permission === 'report:approve' && canApproveReports) {
    return true;
  }

  // Get permissions for the role
  const rolePermissions = ROLE_PERMISSIONS[role];

  // Role not found in mapping
  if (!rolePermissions) {
    return false;
  }

  // Check for wildcard (admin-level access)
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Check for exact permission match
  return rolePermissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 * 
 * @param {string} role - The user's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if the role has at least one permission
 * 
 * @example
 * canAny('staff', ['patient:create', 'patient:update']) // true
 */
function canAny(role, permissions) {
  if (!Array.isArray(permissions)) {
    return can(role, permissions);
  }
  return permissions.some(permission => can(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 * 
 * @param {string} role - The user's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if the role has all permissions
 * 
 * @example
 * canAll('admin', ['patient:create', 'patient:delete']) // true
 * canAll('staff', ['patient:create', 'patient:delete']) // false
 */
function canAll(role, permissions) {
  if (!Array.isArray(permissions)) {
    return can(role, permissions);
  }
  return permissions.every(permission => can(role, permission));
}

/**
 * Get all permissions for a role
 * 
 * @param {string} role - The user's role
 * @returns {string[]} - Array of permissions (or ['*'] for admin)
 */
function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

module.exports = {
  can,
  canAny,
  canAll,
  getPermissionsForRole,
};
