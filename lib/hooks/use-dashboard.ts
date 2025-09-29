'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface DashboardStats {
  totalParts: number;
  lowStockItems: number;
  totalUsers: number;
  recentTransactions: number;
  totalBoards: number;
  readyBoards: number;
  totalBuilds: number;
}

interface RecentActivity {
  id: string;
  type: 'checkout' | 'return' | 'adjustment' | 'build';
  user: string;
  part?: string;
  board?: string;
  quantity: number;
  timestamp: string;
}

export function useDashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [stats, setStats] = useState<DashboardStats>({
    totalParts: 0,
    lowStockItems: 0,
    totalUsers: 0,
    recentTransactions: 0,
    totalBoards: 0,
    readyBoards: 0,
    totalBuilds: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard data...');

      // Fetch inventory stats
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('quantity, min_quantity');

      if (invError) {
        console.error('Inventory fetch error:', invError);
        throw invError;
      }

      console.log('Inventory fetched:', inventory?.length, 'items');

      // Fetch user count (admin only)
      let userCount = 0;
      if (isAdmin) {
        const { count, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (!userError) userCount = count || 0;
      }

      // Fetch board stats (optional - may not exist yet)
      let boards: any[] = [];
      let readyBoards = 0;
      let buildsCount = 0;

      try {
        const { data: boardData, error: boardError } = await supabase
          .from('boards')
          .select(`
            *,
            board_parts (
              quantity_required,
              inventory (quantity)
            )
          `)
          .eq('is_active', true);

        if (!boardError) {
          boards = boardData || [];
          // Count ready boards (those with sufficient parts)
          readyBoards = boards.filter(board =>
            board.board_parts?.every((bp: any) =>
              bp.inventory?.quantity >= bp.quantity_required
            )
          ).length;
        }
      } catch (error) {
        console.log('Boards table not available yet');
      }

      // Fetch total builds (optional - may not exist yet)
      try {
        const { count, error: buildsError } = await supabase
          .from('board_builds')
          .select('*', { count: 'exact', head: true });

        if (!buildsError) {
          buildsCount = count || 0;
        }
      } catch (error) {
        console.log('Board builds table not available yet');
      }

      // Fetch recent transactions (optional - may not exist yet)
      let transactions: any[] = [];
      try {
        const { data: transactionData, error: transError } = await supabase
          .from('transactions')
          .select(`
            *,
            inventory (part_id),
            users (name)
          `)
          .order('timestamp', { ascending: false })
          .limit(5);

        if (!transError) {
          transactions = transactionData || [];
        }
      } catch (error) {
        console.log('Transactions table not available yet');
      }

      // Fetch recent builds (optional - may not exist yet)
      let builds: any[] = [];
      try {
        const { data: buildData, error: buildError } = await supabase
          .from('board_builds')
          .select(`
            *,
            boards (name),
            users (name)
          `)
          .order('built_at', { ascending: false })
          .limit(3);

        if (!buildError) {
          builds = buildData || [];
        }
      } catch (error) {
        console.log('Board builds table not available yet');
      }

      // Combine and sort by actual timestamp, then format
      const rawTransactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        user: t.users?.name || 'Unknown',
        part: t.inventory?.part_id,
        quantity: t.quantity,
        rawTimestamp: t.timestamp
      }));

      const rawBuilds = builds.map(b => ({
        id: b.id,
        type: 'build' as const,
        user: b.users?.name || 'Unknown',
        board: b.boards?.name,
        quantity: b.quantity_built,
        rawTimestamp: b.built_at
      }));

      const allActivity: RecentActivity[] = [...rawTransactions, ...rawBuilds]
        .filter(item => item.rawTimestamp) // Filter out items without timestamps
        .sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime())
        .slice(0, 5)
        .map(item => ({
          ...item,
          timestamp: formatTimeAgo(item.rawTimestamp)
        }));

      // Calculate stats
      const totalParts = inventory?.length || 0;
      const lowStockItems = inventory?.filter(item => item.quantity <= item.min_quantity).length || 0;

      setStats({
        totalParts,
        lowStockItems,
        totalUsers: userCount,
        recentTransactions: transactions.length + builds.length,
        totalBoards: boards.length,
        readyBoards,
        totalBuilds: buildsCount
      });

      setRecentActivity(allActivity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchDashboardData();

      // Set up real-time subscriptions for dashboard data (only for existing tables)
      const subscription = supabase
        .channel('dashboard_data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchDashboardData)
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile?.role]);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}