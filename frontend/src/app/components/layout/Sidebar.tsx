import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';

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
    submenus: [
      {
        path: '/tests',
        label: 'Tests',
      },
      {
        path: '/tests?tab=packages',
        label: 'Packages',
      },
    ],
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
    hideForDoctor: true,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Automatically expand submenus when their main path is active
  useEffect(() => {
    visibleMenuItems.forEach((item: any) => {
      if (item.submenus && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
        setExpandedMenus(prev => {
          if (prev[item.path]) return prev;
          return { ...prev, [item.path]: true };
        });
      }
    });
  }, [location.pathname, visibleMenuItems]);

  const isSubmenuActive = (subPath: string) => {
    const [path, query] = subPath.split('?');
    if (location.pathname !== path) return false;
    if (!query) {
      return !location.search.includes('tab=packages');
    }
    return location.search.includes(query);
  };

  const renderMenuItem = (item: any, isMobileView: boolean) => {
    const Icon = item.icon;
    const isActive = item.path === longestMatch;
    const hasSubmenus = !!item.submenus;
    const isExpanded = expandedMenus[item.path];
    const isCurrentlyCollapsed = !isMobileView && collapsed;

    const triggerEl = (
      <Link
        to={item.path}
        onClick={(e) => {
          if (isMobileView && !hasSubmenus) {
            onToggle(); // Close drawer
          } else if (isCurrentlyCollapsed && hasSubmenus) {
            e.preventDefault(); // Prevent navigation, just open dropdown
          } else if (!isCurrentlyCollapsed && hasSubmenus) {
            setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
          }
        }}
        title={isCurrentlyCollapsed ? item.label : undefined}
        className={`flex items-center justify-between transition-all duration-200 rounded-lg ${
          isCurrentlyCollapsed ? 'justify-center px-4 py-2' : 'px-3 py-2'
        } ${isActive
          ? 'bg-blue-600 text-white shadow-md dark:bg-blue-600 dark:text-white'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCurrentlyCollapsed && (
            <span className="ml-3 text-sm font-medium">{item.label}</span>
          )}
        </div>
        {!isCurrentlyCollapsed && hasSubmenus && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
            }}
            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        )}
      </Link>
    );

    if (isCurrentlyCollapsed && hasSubmenus) {
      return (
        <DropdownMenu key={item.path}>
          <DropdownMenuTrigger asChild>
            {triggerEl}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-40 ml-2 bg-white dark:bg-gray-900 border border-border shadow-lg">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
              {item.label}
            </DropdownMenuLabel>
            {item.submenus.map((sub: any) => {
              const subActive = isSubmenuActive(sub.path);
              return (
                <DropdownMenuItem key={sub.path} asChild>
                  <Link
                    to={sub.path}
                    className={`block w-full px-2 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                      subActive
                        ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    {sub.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div key={item.path} className="space-y-1">
        {triggerEl}

        {!isCurrentlyCollapsed && hasSubmenus && isExpanded && (
          <div className="pl-8 pr-2 py-1 space-y-1 border-l border-gray-200 dark:border-gray-800 ml-5">
            {item.submenus.map((sub: any) => {
              const subActive = isSubmenuActive(sub.path);
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => {
                    if (isMobileView) {
                      onToggle(); // Close drawer
                    }
                  }}
                  className={`block px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    subActive
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-border transition-all duration-300 print:hidden hidden md:block ${collapsed ? 'w-14' : 'w-56'
        }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
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
          <nav className={`flex-1 space-y-2 overflow-y-auto scrollbar-hide ${collapsed ? 'p-2' : 'p-4'
            }`}>
            {visibleMenuItems.map((item: any) => renderMenuItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {!collapsed && isMobile && !isDoctor && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onToggle}
          />
          {/* Mobile Drawer */}
          <div className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-gray-900 border-r border-border transition-transform duration-300 print:hidden md:hidden z-50 transform translate-x-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">DiagnoPro</h1>
                <button
                  onClick={onToggle}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-gray-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {visibleMenuItems.map((item: any) => renderMenuItem(item, true))}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}