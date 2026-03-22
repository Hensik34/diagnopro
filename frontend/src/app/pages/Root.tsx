import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { ThemeProvider } from 'next-themes';

export function Root() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <TopNav sidebarCollapsed={sidebarCollapsed} />
        <main
          className={`pt-12 transition-all duration-200 ${
            sidebarCollapsed ? 'ml-14' : 'ml-56'
          }`}
        >
          <div className="p-4 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}