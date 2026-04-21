import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../../../stores';

// ==========================================
// Protected Route Types
// ==========================================

interface ProtectedRouteProps {
  /** Required permission to access this route */
  permission?: string;
  /** Array of permissions - user needs ANY of these */
  permissions?: string[];
  /** Require ALL permissions (default: false = ANY) */
  requireAll?: boolean;
  /** Custom redirect path when unauthorized (default: /unauthorized) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Protected Route Wrapper
 * 
 * Features:
 * - Authentication check (redirects to login if not authenticated)
 * - Permission-based access control (optional)
 * - Supports single permission or array of permissions
 * - Configurable to require ANY or ALL permissions
 * 
 * @example
 * // Basic auth check (no permission required)
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 * 
 * @example
 * // Single permission required
 * <Route element={<ProtectedRoute permission="report:approve" />}>
 *   <Route path="/approve" element={<ApprovePage />} />
 * </Route>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <Route element={<ProtectedRoute permissions={['patient:create', 'patient:update']} />}>
 *   <Route path="/patients/edit" element={<PatientEdit />} />
 * </Route>
 * 
 * @example
 * // Multiple permissions (ALL required)
 * <Route element={<ProtectedRoute permissions={['report:create', 'report:approve']} requireAll />}>
 *   <Route path="/reports/admin" element={<ReportAdmin />} />
 * </Route>
 */
export function ProtectedRoute({
  permission,
  permissions,
  requireAll = false,
  redirectTo = '/unauthorized',
  loadingComponent,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, initialize, can, canAny, canAll } = useAuthStore();

  // Initialize auth on mount (check token validity)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading while checking auth
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if specified
  if (permission || permissions) {
    let hasPermission = false;

    if (permission) {
      // Single permission check
      hasPermission = can(permission);
    } else if (permissions && permissions.length > 0) {
      // Multiple permissions check
      hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
    }

    if (!hasPermission) {
      // Redirect to unauthorized page
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  // Render child routes
  return <Outlet />;
}

// ==========================================
// Convenience Components
// ==========================================

/**
 * Admin-only route wrapper
 * Shorthand for routes that require admin role
 */
export function AdminRoute({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
