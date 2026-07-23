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
import { useAuthStore, useTimeLogStore, PERMISSIONS } from '../../../stores';
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
    path: '/app',
    label: 'Dashboard',
    icon: LayoutDashboard,
    // Dashboard visible to all
  },
  // Doctor-specific items
  {
    path: '/app/doctor-reports',
    label: 'My Reports',
    icon: FileText,
    doctorOnly: true,
  },
  {
    path: '/app/profile',
    label: 'My Profile',
    icon: User,
    doctorOnly: true,
  },
  {
    path: '/app/reports',
    label: 'Reports',
    icon: FileText,
    permission: PERMISSIONS.REPORT_READ,
    hideForDoctor: true,
  },
  {
    path: '/app/reports/review',
    label: 'Review Reports',
    icon: CheckSquare,
    permission: PERMISSIONS.REPORT_APPROVE,
  },
  {
    path: '/app/patients',
    label: 'Patients',
    icon: User,
    permission: PERMISSIONS.PATIENT_READ,
    hideForDoctor: true,
  },
  {
    path: '/app/sample-collection',
    label: 'Sample Collection',
    icon: Syringe,
    permission: PERMISSIONS.COLLECTION_READ,
  },
  {
    path: '/app/tests',
    label: 'Test Management',
    icon: Beaker,
    permission: PERMISSIONS.TEST_READ,
    hideForDoctor: true,
    submenus: [
      {
        path: '/app/tests',
        label: 'Tests',
        permission: PERMISSIONS.TEST_READ,
      },
      {
        path: '/app/tests?tab=packages',
        label: 'Packages',
        permission: PERMISSIONS.TEST_READ,
      },
      {
        path: '/app/tests/pricing',
        label: 'Test Pricing',
        permission: PERMISSIONS.SETTINGS_VIEW,
      },
    ],
  },
  {
    path: '/app/doctors',
    label: 'Doctor Management',
    icon: Stethoscope,
    permission: PERMISSIONS.DOCTOR_UPDATE,
  },
  {
    path: '/app/branches',
    label: 'Branches',
    icon: Building2,
    permission: PERMISSIONS.BRANCH_UPDATE,
  },
  {
    path: '/app/users',
    label: 'Staff Management',
    icon: Users,
    permission: PERMISSIONS.USER_READ,
  },
  {
    path: '/app/inventory',
    label: 'Inventory',
    icon: Package,
    // Placeholder - visible to admin only for now
    permission: PERMISSIONS.SETTINGS_UPDATE,
  },
  {
    path: '/app/time-tracking',
    label: 'Time Tracking',
    icon: Clock,
    // Visible to all authenticated users (no permission needed)
    hideForDoctor: true,
  },
  {
    path: '/app/analytics',
    label: 'Analytics',
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    path: '/app/b2b',
    label: 'B2B Lab',
    icon: GitBranch,
    permission: PERMISSIONS.B2B_LAB_READ,
    hideForDoctor: true,
  },

  {
    path: '/app/settings',
    label: 'Settings',
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { can, getBranchRole } = useAuthStore();
  const pendingApprovals = useTimeLogStore((s) => s.pendingApprovals);
  const currentRole = getBranchRole();
  const isDoctor = currentRole === 'doctor';
  const isPathologist = currentRole === 'pathologist';
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

  // Filter and transform menu items based on user permissions and role
  const visibleMenuItems = menuItems.filter((item: any) => {
    // Pathologist role sees only Review Reports, Reports, and Profile/Settings
    if (isPathologist) {
      return (
        item.path === '/app/reports/review' ||
        item.path === '/app/reports' ||
        item.path === '/app/settings' ||
        item.path === '/app/profile'
      );
    }
    // Doctor-only items
    if (item.doctorOnly) return isDoctor;
    // Items hidden for doctor
    if (item.hideForDoctor && isDoctor) return false;
    
    // Check permission logic for items with/without submenus
    if (item.submenus && item.submenus.length > 0) {
      const hasParentPermission = !item.permission || can(item.permission);
      const hasSubmenuPermission = item.submenus.some((sub: any) => !sub.permission || can(sub.permission));
      if (!hasParentPermission && !hasSubmenuPermission) return false;
    } else {
      if (item.permission && !can(item.permission)) return false;
    }
    return true;
  }).map((item: any) => {
    if (item.submenus && item.submenus.length > 0) {
      const visibleSubmenus = item.submenus.filter((sub: any) => !sub.permission || can(sub.permission));
      if (visibleSubmenus.length === 1) {
        return {
          path: visibleSubmenus[0].path,
          label: visibleSubmenus[0].label,
          icon: item.icon,
        };
      }
      return {
        ...item,
        submenus: visibleSubmenus,
      };
    }
    return item;
  });

  let longestMatch = '';
  const matchingSubmenuParent = visibleMenuItems.find((item: any) => 
    item.submenus?.some((sub: any) => {
      const subPath = sub.path.split('?')[0];
      return location.pathname === subPath || location.pathname.startsWith(`${subPath}/`);
    })
  );

  if (matchingSubmenuParent) {
    longestMatch = matchingSubmenuParent.path;
  } else {
    visibleMenuItems.forEach((item: any) => {
      if (item.path === '/' && location.pathname === '/') {
        longestMatch = '/';
      } else if (item.path !== '/' && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
        if (item.path.length > longestMatch.length) {
          longestMatch = item.path;
        }
      }
    });
  }

  // Automatically expand submenus when their main path or submenu path is active
  useEffect(() => {
    visibleMenuItems.forEach((item: any) => {
      let shouldExpand = false;
      if (item.submenus) {
        if (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) {
          shouldExpand = true;
        } else {
          shouldExpand = item.submenus.some((sub: any) => {
            const subPath = sub.path.split('?')[0];
            return location.pathname === subPath || location.pathname.startsWith(`${subPath}/`);
          });
        }
      }

      if (shouldExpand) {
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
          } else if (hasSubmenus) {
            e.preventDefault(); // Prevent navigation for parents with submenus
            if (!isCurrentlyCollapsed) {
              setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
            }
          }
        }}
        title={isCurrentlyCollapsed ? item.label : undefined}
        className={`flex items-center justify-between transition-all duration-200 rounded-lg ${
          isCurrentlyCollapsed ? 'justify-center px-4 py-2' : 'px-2 py-2'
        } ${isActive
          ? 'bg-primary/10 text-primary border border-primary/20 font-medium'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCurrentlyCollapsed && (
            <span className="ml-2 text-sm font-medium whitespace-nowrap">{item.label}</span>
          )}
        </div>
        {!isCurrentlyCollapsed && item.path === '/app/time-tracking' && pendingApprovals.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
            {pendingApprovals.length}
          </span>
        )}
        {!isCurrentlyCollapsed && hasSubmenus && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
            }}
            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-180' : ''}`} />
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
            {item.submenus.filter((sub: any) => !sub.permission || can(sub.permission)).map((sub: any) => {
              const subActive = isSubmenuActive(sub.path);
              return (
                <DropdownMenuItem key={sub.path} asChild>
                  <Link
                    to={sub.path}
                    className={`block w-full px-2 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                      subActive
                        ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20 font-semibold'
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
          <div className="pl-6 pr-2 py-1 space-y-1 border-l border-gray-200 dark:border-gray-800 ml-4">
            {item.submenus.filter((sub: any) => !sub.permission || can(sub.permission)).map((sub: any) => {
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
                  className={`block px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    subActive
                      ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20 font-semibold'
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
          <div className="flex items-center justify-between p-3 border-b border-border">
            {!collapsed && (
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">DiagnoPro</h1>
            )}
            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-gray-400 cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className={`flex-1 space-y-2 overflow-y-auto scrollbar-hide ${collapsed ? 'p-2' : 'px-2 py-4'
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
              <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {visibleMenuItems.map((item: any) => renderMenuItem(item, true))}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}