'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { Package, ChartBar as BarChart3, History, QrCode, Settings, Users, TriangleAlert as AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  {
    name: 'QR Scanner',
    href: '/dashboard/scanner',
    icon: QrCode,
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: History,
  },
  {
    name: 'Low Stock',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
  },
];

const adminNavigation = [
  {
    name: 'Manage Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();

  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="fixed left-0 top-12 z-40 h-[calc(100vh-3rem)] w-56 border-r bg-background">
      <div className="flex h-full flex-col gap-1 p-2">
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
                    'w-full justify-start gap-2 h-8 px-2 text-sm',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            <div className="my-2 h-px bg-border" />
            <nav className="space-y-1">
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start gap-2 h-8 px-2 text-sm',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}