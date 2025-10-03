'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    userName: string;
    currentRole: 'admin' | 'member';
    newRole: 'admin' | 'member';
  } | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateRoleChange = (user: User, newRole: 'admin' | 'member') => {
    // Prevent admins from demoting other admins
    if (user.role === 'admin' && newRole === 'member') {
      alert('You cannot demote other administrators. This is a security measure.');
      return;
    }

    // Set pending change and open confirmation modal
    setPendingRoleChange({
      userId: user.id,
      userName: user.name,
      currentRole: user.role,
      newRole: newRole,
    });
    setConfirmationText('');
    setConfirmModalOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    // Verify confirmation text matches user name
    if (confirmationText !== pendingRoleChange.userName) {
      alert('The name you entered does not match. Please try again.');
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: pendingRoleChange.newRole })
        .eq('id', pendingRoleChange.userId);

      if (error) throw error;

      // Refresh users list
      await fetchUsers();

      // Close modal and reset state
      setConfirmModalOpen(false);
      setPendingRoleChange(null);
      setConfirmationText('');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelRoleChange = () => {
    setConfirmModalOpen(false);
    setPendingRoleChange(null);
    setConfirmationText('');
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="minimal-layout">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Access Denied</h3>
            <p className="text-gray-500">You need admin privileges to access user management.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="minimal-layout">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>User Management</h1>
            <p>{filteredUsers.length} users • {filteredUsers.filter(u => u.role === 'admin').length} admins</p>
          </div>

          <div className="search-container">
            <Search className="search-icon w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="clean-card">
        <table className="github-table">
          <thead>
            <tr>
              <th style={{minWidth: '200px'}}>User</th>
              <th style={{minWidth: '250px'}}>Email</th>
              <th style={{width: '100px'}}>Role</th>
              <th style={{width: '150px'}}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      {user.id === profile?.id && (
                        <div className="text-xs text-gray-500">You</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div>{user.email}</div>
                </td>
                <td>
                  <select
                    key={`role-${user.id}-${user.role}`}
                    defaultValue={user.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'admin' | 'member';
                      if (newRole !== user.role) {
                        initiateRoleChange(user, newRole);
                      }
                      // Reset dropdown to original value
                      e.target.value = user.role;
                    }}
                    className="github-input text-xs h-8"
                    disabled={user.id === profile?.id} // Can't change own role
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
            </p>
          </div>
        )}
      </div>

      {/* User Statistics */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Users</div>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-description">Registered accounts</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Administrators</div>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-card-description">Admin privileges</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">New This Month</div>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">
            {users.filter(u => {
              const userDate = new Date(u.created_at);
              const now = new Date();
              return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
            }).length}
          </div>
          <div className="stat-card-description">Recent signups</div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={cancelRoleChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Role Change
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action cannot be undone. This will change the user's permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pendingRoleChange && (
              <>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-xs text-gray-500 mb-1">Changing role for:</div>
                  <div className="font-semibold text-sm">{pendingRoleChange.userName}</div>
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">From:</span> {pendingRoleChange.currentRole} → <span className="font-medium">To:</span> {pendingRoleChange.newRole}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-name" className="text-xs font-semibold text-gray-900">
                    Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{pendingRoleChange.userName}</span> to confirm:
                  </Label>
                  <Input
                    id="confirm-name"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Enter user name"
                    className="github-input text-xs h-8"
                    autoComplete="off"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={cancelRoleChange}
              disabled={isUpdating}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={isUpdating || confirmationText !== pendingRoleChange?.userName}
              className="h-8 text-xs bg-orange-600 hover:bg-orange-700"
            >
              {isUpdating ? 'Updating...' : 'Confirm Change'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}