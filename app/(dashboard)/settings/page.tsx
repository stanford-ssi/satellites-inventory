'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [displayName, setDisplayName] = useState('');

  // Initialize display name from profile when it loads
  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
  }, [profile?.name]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and preferences</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <User className="h-4 w-4 text-gray-500" />
          <div className="dashboard-card-title">Profile</div>
        </div>

        <div className="flex items-start gap-6 mt-4">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl font-medium">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="displayName" className="text-xs font-semibold text-gray-900">Display Name</Label>
              <Input
                id="displayName"
                className="github-input text-xs h-8"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-900">Email Address</Label>
              <Input
                id="email"
                type="email"
                className="github-input text-xs h-8"
                value={profile?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-900">Role</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                  {isAdmin ? "Admin" : "Member"}
                </Badge>
                <span className="text-xs text-gray-500">Assigned by administrator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <Shield className="h-4 w-4 text-gray-500" />
          <div className="dashboard-card-title">Access</div>
        </div>

        <div className="mt-3">
          {/* Sensitive Parts Access */}
          <div className="p-3 border border-gray-200 rounded-md">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <Label className="text-xs font-semibold text-gray-900">Sensitive Parts Access</Label>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {isAdmin ? "Full access to all inventory items" : "Restricted access to sensitive components"}
            </p>
            <Badge variant={isAdmin ? "default" : "outline"} className="text-xs">
              {isAdmin ? "Granted" : "Limited"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">Account Actions</div>
        </div>

        <div className="mt-3">
          <Button
            variant="outline"
            className="w-full md:w-auto h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}