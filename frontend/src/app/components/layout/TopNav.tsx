import { Bell, Search, Moon, Sun, Building2, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../../stores';
import { ProfileModal } from './ProfileModal';
import { NotificationsPanel } from './NotificationsPanel';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  sidebarHidden?: boolean;
}

export function TopNav({ sidebarCollapsed, onSidebarToggle, sidebarHidden }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Get data from stores
  const { user, logout, getBranchRole } = useAuthStore();
  const { branches, currentBranchId } = useBranchStore();
  const isDoctor = getBranchRole() === 'doctor';

  // Get current branch name
  const currentBranch = branches.find(b => b.id === currentBranchId);

  // User display info
  const userDisplayName = user ? `${user.firstname} ${user.lastname}` : 'User';
  const userInitials = user
    ? `${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`.toUpperCase()
    : 'U';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'Staff';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 h-13 bg-card border-b border-border z-30 transition-all duration-200 print:hidden ${
        sidebarHidden ? 'left-0' : (sidebarCollapsed ? 'left-0 md:left-14' : 'left-0 md:left-56')
      }`}
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        {!isDoctor && (
          <button
            onClick={onSidebarToggle}
            className="md:hidden p-1 rounded hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Branch Badge — read-only indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {currentBranch && (
            <div className="h-8 px-2 md:px-3 flex items-center gap-1.5 md:gap-2 bg-primary/10 text-primary rounded text-[11px] md:text-[13px] whitespace-nowrap border border-primary/20">
              <Building2 className="w-3.5 md:w-4 h-3.5 md:h-4 flex-shrink-0" />
              <span className="hidden sm:inline max-w-[80px] md:max-w-[150px] truncate font-medium">
                {currentBranch.name}
              </span>
            </div>
          )}

          {/* Current Time - Hidden on mobile */}
          <div className="hidden lg:flex items-center text-xs text-blue-500 font-semibold text-muted-foreground border-l border-border pl-3">
            <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="mx-1.5">•</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Search - Hidden on small screens */}
        <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right actions - Responsive spacing */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications - Hidden on small screens */}
          {user?.role !== 'staff' && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-accent transition-colors relative group cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full group-hover:animate-pulse" />
              </button>
              <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>
          )}

          {/* User profile - Compact with dropdown */}
          <div className="relative ml-0 md:ml-1 md:pl-2 md:border-l border-border" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 md:gap-2 hover:bg-accent rounded p-1 transition-colors cursor-pointer"
              title={`${user?.firstname} ${user?.lastname}`}
            >
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-foreground text-xs">{userDisplayName}</span>
                <span className="text-muted-foreground text-[10px]">{userRole}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">
                {userInitials}
              </div>
            </button>
            <ProfileModal user={user} isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} />
          </div>
        </div>
      </div>
    </header>
  );
}