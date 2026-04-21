import { useAuthStore } from '../../../stores';

// ==========================================
// Can Component Types
// ==========================================

interface CanProps {
  /** Single permission to check */
  permission?: string;
  /** Array of permissions - user needs ANY of these (or ALL if requireAll=true) */
  permissions?: string[];
  /** Require ALL permissions (default: false = ANY) */
  requireAll?: boolean;
  /** Content to render if user has permission */
  children: React.ReactNode;
  /** Optional fallback content when user lacks permission */
  fallback?: React.ReactNode;
}

/**
 * Permission-based conditional rendering component
 * 
 * Renders children only if the current user has the required permission(s).
 * This is the preferred way to conditionally show UI elements based on permissions.
 * 
 * @example
 * // Single permission
 * <Can permission="report:approve">
 *   <ApproveButton />
 * </Can>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <Can permissions={['patient:create', 'patient:update']}>
 *   <EditPatientButton />
 * </Can>
 * 
 * @example
 * // Multiple permissions (ALL required)
 * <Can permissions={['report:create', 'report:approve']} requireAll>
 *   <FullReportAccess />
 * </Can>
 * 
 * @example
 * // With fallback
 * <Can permission="report:download" fallback={<UpgradePrompt />}>
 *   <DownloadButton />
 * </Can>
 */
export function Can({ 
  permission, 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null 
}: CanProps) {
  const { can, canAny, canAll } = useAuthStore();

  let hasPermission = false;

  if (permission) {
    // Single permission check
    hasPermission = can(permission);
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    // No permission specified, render children
    hasPermission = true;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Inverse of Can - renders children only if user LACKS the permission
 * Useful for showing "upgrade" prompts or alternative UI for restricted users
 * 
 * @example
 * <Cannot permission="analytics:view">
 *   <p>Analytics feature requires premium access</p>
 * </Cannot>
 */
export function Cannot({ 
  permission, 
  permissions, 
  requireAll = false, 
  children,
  fallback = null,
}: CanProps) {
  const { can, canAny, canAll } = useAuthStore();

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  }

  return !hasPermission ? <>{children}</> : <>{fallback}</>;
}

// ==========================================
// Higher-Order Component Version
// ==========================================

/**
 * HOC to wrap components with permission checks
 * 
 * @example
 * const ProtectedDeleteButton = withPermission(DeleteButton, 'patient:delete');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  Fallback?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P) {
    const { can } = useAuthStore();
    
    if (!can(permission)) {
      return Fallback ? <Fallback /> : null;
    }
    
    return <Component {...props} />;
  };
}
