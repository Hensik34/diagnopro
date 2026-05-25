import { Bell, Search, Moon, Sun, Building2, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../../stores';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export function TopNav({ sidebarCollapsed, onSidebarToggle }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get data from stores
  const { user, logout } = useAuthStore();
  const { branches, currentBranchId, setCurrentBranchId } = useBranchStore();

  // Get current branch name
  const currentBranch = branches.find(b => b.id === currentBranchId);
  const displayBranchName = currentBranch?.name || 'Select Branch';

  // User display info
  const userDisplayName = user ? `${user.firstname} ${user.lastname}` : 'User';
  const userInitials = user 
    ? `${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`.toUpperCase()
    : 'U';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'Staff';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchSelect = (branchId: string) => {
    setCurrentBranchId(branchId);
    setShowBranchDropdown(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className={`fixed top-0 right-0 h-12 bg-card border-b border-border z-30 transition-all duration-200 print:hidden ${
        sidebarCollapsed ? 'left-0 md:left-14' : 'left-0 md:left-56'
      }`}
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onSidebarToggle}
          className="md:hidden p-1 rounded hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branch Selector */}
        <div className="flex items-center gap-2 md:gap-3">
          {branches.length > 1 ? (
            /* Multiple branches — show dropdown */
            <div className="relative" ref={branchDropdownRef}>
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="h-8 pl-2 md:pl-3 pr-6 md:pr-8 flex items-center gap-1.5 md:gap-2 bg-primary text-white rounded text-[11px] md:text-[13px] hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Building2 className="w-3.5 md:w-4 h-3.5 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline max-w-[80px] md:max-w-[150px] truncate">{displayBranchName}</span>
                <ChevronDown className={`w-3 md:w-3.5 h-3 md:h-3.5 absolute right-1.5 md:right-2.5 transition-transform flex-shrink-0 ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Branch Dropdown */}
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 md:w-56 bg-card border border-border rounded-md shadow-lg py-1 z-50">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch.id)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                        branch.id === currentBranchId ? 'bg-accent text-primary' : 'text-foreground'
                      }`}
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : branches.length === 1 ? (
            /* Single branch — show static name, no dropdown */
            <div className="h-8 px-2 md:px-3 flex items-center gap-1.5 md:gap-2 bg-primary text-white rounded text-[11px] md:text-[13px] whitespace-nowrap">
              <Building2 className="w-3.5 md:w-4 h-3.5 md:h-4 flex-shrink-0" />
              <span className="hidden sm:inline max-w-[80px] md:max-w-[150px] truncate">{branches[0].name}</span>
            </div>
          ) : null}
          
          {/* Current Time - Hidden on mobile */}
          <div className="hidden lg:flex items-center text-xs text-muted-foreground border-l border-border pl-3">
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
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications - Hidden on small screens */}
          <button
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-accent transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>

          {/* User profile - Compact with dropdown */}
          <div className="relative ml-0 md:ml-1 md:pl-2 md:border-l border-border" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 md:gap-2 hover:bg-accent rounded p-1 transition-colors"
            >
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-foreground text-xs">{userDisplayName}</span>
                <span className="text-muted-foreground text-[10px]">{userRole}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">
                {userInitials}
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 md:w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}