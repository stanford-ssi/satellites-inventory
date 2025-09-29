'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarWidth, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main
          className="flex-1 transition-all duration-150 ease-out"
          style={{
            marginLeft: isMobile ? 0 : `${sidebarWidth}px`
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}