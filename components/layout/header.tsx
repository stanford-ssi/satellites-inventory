'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { LogOut, Package, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6" />
          <span className="font-bold">Inventory Manager</span>
        </div>

        <div className="flex-1" />

        <nav className="flex items-center space-x-4">
          {user && profile && (
            <>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile.name}</span>
                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                  {profile.role}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}