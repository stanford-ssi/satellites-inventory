'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { Package, ChartBar as BarChart3, History, Settings, Users, X, AlertCircle, UserCircle, QrCode, Hammer } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useCallback } from 'react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
  },
];

const buildNavigation = [
  {
    name: 'Boards',
    href: '/dashboard/boards',
    icon: Hammer,
  },
  {
    name: 'Scan QR',
    href: '/dashboard/scanner',
    icon: QrCode,
  },
];

const profileNavigation = [
  {
    name: 'My Items',
    href: '/dashboard/my-items',
    icon: UserCircle,
  },
  {
    name: 'Profile',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const adminNavigation = [
  {
    name: 'Items Out',
    href: '/dashboard/outstanding',
    icon: AlertCircle,
  },
  {
    name: 'History',
    href: '/dashboard/transactions',
    icon: History,
  },
  {
    name: 'Manage Users',
    href: '/dashboard/users',
    icon: Users,
  },
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const { sidebarWidth, isMobile, isOpen, toggle, setSidebarWidth, setMobileOpen } = useSidebar();

  const sidebarRef = useRef<HTMLElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const isAdmin = profile?.role === 'admin';

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, setMobileOpen]);

  // Handle backdrop click on mobile
  const handleBackdropClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Determine if we should show labels based on width
  const showLabels = sidebarWidth > 100;

  // Mouse down handler for starting resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;

    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;

    // Prevent text selection during drag
    e.preventDefault();
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [isMobile, sidebarWidth]);

  // Mouse move handler for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || isMobile) return;

    const deltaX = e.clientX - startX.current;
    const newWidth = startWidth.current + deltaX;
    setSidebarWidth(newWidth);
  }, [isMobile, setSidebarWidth]);

  // Mouse up handler for ending resize
  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isMobile) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleBackdropClick}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-12 z-50 h-[calc(100vh-3rem)] border-r bg-background',
          // Mobile positioning and width
          isMobile && 'w-56 transition-transform duration-200',
          isMobile && (isOpen ? 'translate-x-0' : '-translate-x-full'),
          // Desktop positioning
          !isMobile && 'translate-x-0 transition-none'
        )}
        style={{
          width: isMobile ? undefined : `${sidebarWidth}px`
        }}
      >
        <div className="flex h-full flex-col relative">

          {/* Close button for mobile */}
          {isMobile && (
            <div className="flex justify-between items-center p-2 border-b">
              <span className="font-semibold text-sm">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full h-9 text-sm transition-all',
                        showLabels ? 'justify-start gap-3 px-3' : 'justify-center px-0',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                      title={!showLabels ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {showLabels && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <>
              <div className="my-3 h-px bg-border" />
              <nav className="space-y-1">
                {showLabels && (
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Build
                    </p>
                  </div>
                )}
                {buildNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full h-9 text-sm transition-all',
                          showLabels ? 'justify-start gap-3 px-3' : 'justify-center px-0',
                          isActive && 'bg-primary text-primary-foreground'
                        )}
                        title={!showLabels ? item.name : undefined}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {showLabels && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </>
            
            <>
              <div className="my-3 h-px bg-border" />
              <nav className="space-y-1">
                {showLabels && (
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Profile
                    </p>
                  </div>
                )}
                {profileNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full h-9 text-sm transition-all',
                          showLabels ? 'justify-start gap-3 px-3' : 'justify-center px-0',
                          isActive && 'bg-primary text-primary-foreground'
                        )}
                        title={!showLabels ? item.name : undefined}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {showLabels && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </>


            {isAdmin && (
              <>
                <div className="my-3 h-px bg-border" />
                <nav className="space-y-1">
                  {showLabels && (
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Admin
                      </p>
                    </div>
                  )}
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? 'default' : 'ghost'}
                          size="sm"
                          className={cn(
                            'w-full h-9 text-sm transition-all',
                            showLabels ? 'justify-start gap-3 px-3' : 'justify-center px-0',
                            isActive && 'bg-primary text-primary-foreground'
                          )}
                          title={!showLabels ? item.name : undefined}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {showLabels && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>

          {/* Resize handle - completely invisible but draggable */}
          {!isMobile && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize group"
              onMouseDown={handleMouseDown}
            >
              {/* Invisible wider hit area for easier dragging */}
              <div className="absolute -left-2 -right-2 top-0 bottom-0" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}