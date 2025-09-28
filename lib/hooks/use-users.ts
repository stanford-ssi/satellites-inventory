'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type User = Database['public']['Tables']['users']['Row'];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // For now, only show current user due to RLS restrictions
      // TODO: Implement admin function to view all users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at');

      if (error) {
        setError('Note: Can only view your own profile due to security policies');
        setUsers([]);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (id: string, role: 'admin' | 'member') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUsers(prev => prev.map(user => user.id === id ? data : user));
      return data;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUserRole,
  };
}