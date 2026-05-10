import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Package,
  UserCog,
  Beaker,
  Syringe,
  FilePlus,
  FlaskConical,
  User,
  Stethoscope,
  CheckSquare,
  Clock,
  Timer,
  GitBranch,
} from 'lucide-react';
import { useAuthStore, PERMISSIONS } from '../../../stores';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Menu items with permission-based visibility
 * Each item can have an optional permission or permissions array
 * Items without permissions are visible to all authenticated users
 * Items with doctorOnly are only visible to doctor role users
 */
const menuItems = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    // Dashboard visible to all
  },
  // Doctor-specific items
  {
    path: '/doctor-reports',
    label: 'My Reports',
    icon: FileText,
    doctorOnly: true,
  },
  {
    path: '/profile',
    label: 'My Profile',
    icon: User,
    doctorOnly: true,
  },
  { 
    path: '/reports', 
    label: 'Reports', 
    icon: FileText,
    permission: PERMISSIONS.REPORT_READ,
    hideForDoctor: true,
  },
  { 
    path: '/reports/review', 
    label: 'Review Reports', 
    icon: CheckSquare,
    permission: PERMISSIONS.REPORT_APPROVE,
  },
  { 
    path: '/patients', 
    label: 'Patients', 
    icon: User,
    permission: PERMISSIONS.PATIENT_READ,
    hideForDoctor: true,
  },
  { 
    path: '/sample-collection', 
    label: 'Sample Collection', 
    icon: Syringe,
    permission: PERMISSIONS.COLLECTION_READ,
  },
  { 
    path: '/tests', 
    label: 'Test Management', 
    icon: Beaker,
    permission: PERMISSIONS.TEST_READ,
    hideForDoctor: true,
  },
  { 
    path: '/doctors', 
    label: 'Doctor Management', 
    icon: Stethoscope,
    permission: PERMISSIONS.DOCTOR_UPDATE,
  },
  { 
    path: '/branches', 
    label: 'Branches', 
    icon: Building2,
    permission: PERMISSIONS.BRANCH_UPDATE,
  },
  { 
    path: '/users', 
    label: 'Users', 
    icon: Users,
    permission: PERMISSIONS.USER_READ,
  },
  { 
    path: '/inventory', 
    label: 'Inventory', 
    icon: Package,
    // Placeholder - visible to admin only for now
    permission: PERMISSIONS.SETTINGS_UPDATE,
  },
  { 
    path: '/time-tracking', 
    label: 'Time Tracking', 
    icon: Clock,
    // Visible to all authenticated users (no permission needed)
  },
  { 
    path: '/working-hours', 
    label: 'Working Hours', 
    icon: Timer,
    permission: PERMISSIONS.TIMELOG_VIEW_ALL,
  },
  { 
    path: '/analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  // B2B Reference Lab section
  {
    path: '/b2b',
    label: 'B2B Lab',
    icon: GitBranch,
    permission: PERMISSIONS.B2B_LAB_READ,
    hideForDoctor: true,
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { can, getBranchRole } = useAuthStore();
  const currentRole = getBranchRole();
  const isDoctor = currentRole === 'doctor';

  // Filter menu items based on user permissions and role
  const visibleMenuItems = menuItems.filter((item: any) => {
    // Doctor-only items
    if (item.doctorOnly) return isDoctor;
    // Items hidden for doctor
    if (item.hideForDoctor && isDoctor) return false;
    // No permission required - visible to all
    if (!item.permission) return true;
    // Check single permission
    return can(item.permission);
  });

  let longestMatch = '';
  visibleMenuItems.forEach((item: any) => {
    if (item.path === '/' && location.pathname === '/') {
      longestMatch = '/';
    } else if (item.path !== '/' && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
      if (item.path.length > longestMatch.length) {
        longestMatch = item.path;
      }
    }
  });

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 print:hidden ${
      collapsed ? 'w-14' : 'w-56'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">DiagnoPro</h1>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-gray-400"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item: any) => {
            const Icon = item.icon;
            const isActive = item.path === longestMatch;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center transition-all duration-200 rounded-lg ${
                  collapsed ? 'justify-center px-4 py-2' : 'px-3 py-2'
                } ${
                  isActive
                    ? collapsed
                      ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-600 dark:text-white'
                      : 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}