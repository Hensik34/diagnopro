import { Link, useLocation } from 'react-router';
import { LayoutDashboard, FileText, User } from 'lucide-react';

export function DoctorBottomNav() {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: (pathname: string) => pathname === '/',
    },
    {
      path: '/doctor-reports',
      label: 'Reports',
      icon: FileText,
      isActive: (pathname: string) => pathname.startsWith('/doctor-reports') || pathname.startsWith('/reports'),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      isActive: (pathname: string) => pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe md:hidden shadow-lg select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(location.pathname);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 ${
              active
                ? 'text-blue-600 dark:text-blue-400 font-semibold scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon 
                className={`w-6 h-6 transition-transform duration-200 ${
                  active ? 'stroke-[2.5px] drop-shadow-sm' : 'stroke-[2px]'
                }`} 
              />
            </div>
            <span className="text-[10px] mt-0.5 tracking-medium transition-all duration-200">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
