/**
 * ============================================
 * AUTHORIZATION MIDDLEWARE
 * ============================================
 * 
 * Express middleware for permission-based access control.
 * Combines JWT authentication with RBAC permission checking.
 * 
 * Usage in routes:
 *   router.post('/reports', authorize('report:create'), createReport);
 *   router.delete('/patients/:id', authorize('patient:delete'), deletePatient);
 * 
 * IMPORTANT: All authorization goes through this middleware.
 * DO NOT do role checks like `if (req.user.role === 'admin')` anywhere.
 */

const jwt = require('jsonwebtoken');
const { can, canAny } = require('../utils/can');
const { PERMISSIONS } = require('../config/permissions');

/**
 * Creates authorization middleware for a specific permission
 * 
 * @param {string|string[]} permission - Required permission(s)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.requireAll - If true, requires ALL permissions (default: false = ANY)
 * @returns {Function} Express middleware
 * 
 * @example
 * // Single permission
 * router.post('/patients', authorize('patient:create'), createPatient);
 * 
 * // Multiple permissions (ANY)
 * router.get('/reports', authorize(['report:read', 'report:download']), getReports);
 * 
 * // Multiple permissions (ALL required)
 * router.delete('/reports/:id', authorize(['report:delete', 'report:approve'], { requireAll: true }), deleteReport);
 */
function authorize(permission, options = {}) {
  const { requireAll = false } = options;

  return (req, res, next) => {
    try {
      // ==========================================
      // STEP 1: Extract and verify JWT token
      // ==========================================
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          error: 'Authorization token is missing',
          code: 'AUTH_TOKEN_MISSING'
        });
      }

      // Extract token from "Bearer <token>"
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        return res.status(401).json({
          error: 'Invalid token format',
          code: 'AUTH_TOKEN_INVALID_FORMAT'
        });
      }

      // Verify and decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = decoded;

      // ==========================================
      // STEP 2: Check permission
      // ==========================================
      const userRole = decoded.role;

      if (!userRole) {
        return res.status(403).json({
          error: 'User role not found in token',
          code: 'RBAC_ROLE_MISSING'
        });
      }

      // Handle array of permissions
      let hasPermission = false;

      if (Array.isArray(permission)) {
        if (requireAll) {
          // User must have ALL permissions
          hasPermission = permission.every(p => can(userRole, p));
        } else {
          // User must have ANY permission
          hasPermission = canAny(userRole, permission);
        }
      } else {
        // Single permission check
        hasPermission = can(userRole, permission);
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'You do not have permission to perform this action',
          code: 'RBAC_FORBIDDEN',
          requiredPermission: permission,
          userRole: userRole
        });
      }

      // ==========================================
      // STEP 3: Permission granted, proceed
      // ==========================================
      next();

    } catch (err) {
      // Handle JWT errors
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token has expired',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'AUTH_TOKEN_INVALID'
        });
      }

      // Generic error
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  };
}

/**
 * Authentication-only middleware (no permission check)
 * Use when you only need to verify the user is logged in
 * 
 * @example
 * router.get('/profile', authenticate, getProfile);
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization token is missing',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'AUTH_TOKEN_INVALID_FORMAT'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

/**
 * Helper to check permission within a controller
 * Use for conditional logic inside handlers
 * 
 * @example
 * // In a controller
 * if (hasPermission(req, 'report:approve')) {
 *   // Allow approval
 * }
 */
function hasPermission(req, permission) {
  if (!req.user || !req.user.role) {
    return false;
  }
  return can(req.user.role, permission);
}

// Export PERMISSIONS constant for easy access in routes
module.exports = {
  authorize,
  authenticate,
  hasPermission,
  PERMISSIONS,
};
