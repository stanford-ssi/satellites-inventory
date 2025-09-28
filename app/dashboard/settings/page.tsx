'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Shield, Database, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState } from 'react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [settings, setSettings] = useState({
    displayName: profile?.name || '',
    email: profile?.email || '',
    notifications: true,
    compactMode: false,
    autoRefresh: true,
  });

  const handleSave = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', settings);
  };

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences and application settings.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Profile Settings */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <User className="h-4 w-4 text-gray-500" />
            <div className="dashboard-card-title">Profile Information</div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="displayName" className="text-xs font-medium">Display Name</Label>
              <Input
                id="displayName"
                className="github-input"
                value={settings.displayName}
                onChange={(e) => setSettings({...settings, displayName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                className="github-input"
                value={settings.email}
                disabled
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? "destructive" : "secondary"} className="text-xs">
                {isAdmin ? "Admin" : "Member"}
              </Badge>
              <span className="text-xs text-gray-500">Role assigned by administrator</span>
            </div>
          </div>
        </div>

        {/* Application Preferences */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <Bell className="h-4 w-4 text-gray-500" />
            <div className="dashboard-card-title">Preferences</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive alerts for low stock and system updates</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Compact Mode</Label>
                <p className="text-xs text-gray-500">Reduce spacing and use smaller text</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.compactMode}
                onChange={(e) => setSettings({...settings, compactMode: e.target.checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Auto Refresh</Label>
                <p className="text-xs text-gray-500">Automatically refresh inventory data</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({...settings, autoRefresh: e.target.checked})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <Shield className="h-4 w-4 text-gray-500" />
          <div className="dashboard-card-title">Security & Access</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">Account Security</h4>
            <div className="space-y-2">
              <Button variant="outline" className="justify-start h-auto p-2 w-full">
                <div className="text-left">
                  <div className="font-medium text-xs">Change Password</div>
                  <div className="text-xs text-gray-500">Update your account password</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-2 w-full">
                <div className="text-left">
                  <div className="font-medium text-xs">Two-Factor Authentication</div>
                  <div className="text-xs text-gray-500">Enable 2FA for added security</div>
                </div>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">Data Access</h4>
            <div className="space-y-2">
              <div className="p-2 border border-gray-200 rounded-md">
                <div className="font-medium text-xs">Sensitive Parts Access</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {isAdmin ? "Full access to all inventory items" : "Restricted access to sensitive components"}
                </div>
                <Badge variant={isAdmin ? "default" : "outline"} className="text-xs mt-1">
                  {isAdmin ? "Granted" : "Limited"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information (Admin Only) */}
      {isAdmin && (
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <Database className="h-4 w-4 text-gray-500" />
            <div className="dashboard-card-title">System Information</div>
          </div>
          <div className="dashboard-card-description mb-3">Application and database status</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>App Version</span>
                <span className="font-mono">v1.0.0</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Database Status</span>
                <span className="text-green-600">Connected</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Last Backup</span>
                <span className="font-mono">2h ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="github-button github-button-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}