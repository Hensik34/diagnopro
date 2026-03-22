import { Bell, Search, Moon, Sun, Building2, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

interface TopNavProps {
  sidebarCollapsed: boolean;
}

export function TopNav({ sidebarCollapsed }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  const branches = [
    'All Branches',
    'Central Lab - Downtown',
    'North Branch',
    'West Side Laboratory',
    'East Medical Center',
  ];

  return (
    <header
      className={`fixed top-0 right-0 h-12 bg-card border-b border-border z-30 transition-all duration-200 ${
        sidebarCollapsed ? 'left-14' : 'left-56'
      }`}
    >
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Branch Selector - Prominent */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="h-8 pl-3 pr-8 flex items-center gap-2 bg-primary text-white rounded text-[13px] hover:opacity-90 transition-opacity">
              <Building2 className="w-4 h-4" />
              <span className="whitespace-nowrap">{selectedBranch}</span>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5" />
            </button>
          </div>
          
          {/* Current Time - Compact */}
          <div className="hidden lg:flex items-center text-xs text-muted-foreground border-l border-border pl-3">
            <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="mx-1.5">•</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Search - Compact */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients, tests, reports..."
              className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right actions - Compact */}
        <div className="flex items-center gap-2">
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

          {/* Notifications */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>

          {/* User profile - Compact */}
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-foreground text-xs">Dr. S. Johnson</span>
              <span className="text-muted-foreground text-[10px]">Admin</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs">
              SJ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}