'use client';

import { Badge } from '@/components/ui/badge';
import { Users, Search, UserPlus, Edit, Trash2, Shield, Clock } from 'lucide-react';
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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
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

          <div className="flex items-center gap-3">
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
            <button className="github-button github-button-primary github-button-sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Invite User
            </button>
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
              <th style={{width: '120px'}}>Actions</th>
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
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'member')}
                    className="github-input text-xs"
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
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      className="github-button github-button-sm"
                      disabled={user.id === profile?.id}
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      className="github-button github-button-sm text-red-600 hover:bg-red-50"
                      disabled={user.id === profile?.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
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
    </div>
  );
}