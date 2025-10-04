'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-context';
import { LogOut, Package, Settings, Menu, BarChart3, Hammer, UserCircle, AlertCircle, History, Users, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center px-3">
        <div className="flex items-center space-x-2">
          {/* Mobile navigation dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center cursor-pointer">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/inventory" className="flex items-center cursor-pointer">
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Build</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/boards" className="flex items-center cursor-pointer">
                  <Hammer className="h-4 w-4 mr-2" />
                  Boards
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/scanner" className="flex items-center cursor-pointer">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/my-items" className="flex items-center cursor-pointer">
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Items
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/outstanding" className="flex items-center cursor-pointer">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Items Out
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/transactions" className="flex items-center cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/users" className="flex items-center cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <a href="/dashboard" className="flex items-center space-x-2">
            <img src="/ssi-glitch.png" alt="Logo" className="h-6 w-6" />
            <span className="font-bold text-sm hidden sm:inline">
              Satellites Inventory Manager
            </span>
            <span className="font-bold text-sm sm:hidden">
              Inventory
            </span>
          </a>
        </div>

        <div className="flex-1" />

        <nav className="flex items-center space-x-2">
          {user && profile && (
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}