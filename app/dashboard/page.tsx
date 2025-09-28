'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Users, Clock, QrCode, Plus, Hammer, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

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

export default function DashboardPage() {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch inventory stats
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('quantity, min_quantity');

      if (invError) throw invError;

      // Fetch user count (admin only)
      let userCount = 0;
      if (isAdmin) {
        const { count, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (!userError) userCount = count || 0;
      }

      // Fetch board stats
      const { data: boards, error: boardError } = await supabase
        .from('boards')
        .select(`
          *,
          board_parts (
            quantity_required,
            inventory (quantity)
          )
        `)
        .eq('is_active', true);

      if (boardError) throw boardError;

      // Count ready boards (those with sufficient parts)
      const readyBoards = (boards || []).filter(board =>
        board.board_parts.every((bp: any) =>
          bp.inventory.quantity >= bp.quantity_required
        )
      ).length;

      // Fetch total builds
      const { count: buildsCount, error: buildsError } = await supabase
        .from('board_builds')
        .select('*', { count: 'exact', head: true });

      if (buildsError) throw buildsError;

      // Fetch recent transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          inventory (part_id),
          users (name)
        `)
        .order('timestamp', { ascending: false })
        .limit(5);

      // Fetch recent builds
      const { data: builds, error: buildError } = await supabase
        .from('board_builds')
        .select(`
          *,
          boards (name),
          users (name)
        `)
        .order('built_at', { ascending: false })
        .limit(3);

      // Combine and format recent activity
      const formattedTransactions: RecentActivity[] = (transactions || []).map(t => ({
        id: t.id,
        type: t.type,
        user: t.users?.name || 'Unknown',
        part: t.inventory?.part_id,
        quantity: t.quantity,
        timestamp: formatTimeAgo(t.timestamp)
      }));

      const formattedBuilds: RecentActivity[] = (builds || []).map(b => ({
        id: b.id,
        type: 'build' as const,
        user: b.users?.name || 'Unknown',
        board: b.boards?.name,
        quantity: b.quantity_built,
        timestamp: formatTimeAgo(b.built_at)
      }));

      const allActivity = [...formattedTransactions, ...formattedBuilds]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 4);

      // Calculate stats
      const totalParts = inventory?.length || 0;
      const lowStockItems = inventory?.filter(item => item.quantity <= item.min_quantity).length || 0;

      setStats({
        totalParts,
        lowStockItems,
        totalUsers: userCount,
        recentTransactions: (transactions?.length || 0) + (builds?.length || 0),
        totalBoards: boards?.length || 0,
        readyBoards,
        totalBuilds: buildsCount || 0
      });

      setRecentActivity(allActivity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const dashboardStats = [
    {
      title: 'Total Parts',
      value: stats.totalParts.toString(),
      description: `${stats.lowStockItems} need restocking`,
      icon: Package,
      trend: '+2 this week',
      trendUp: true,
    },
    {
      title: 'Board Designs',
      value: stats.totalBoards.toString(),
      description: `${stats.readyBoards} ready to build`,
      icon: Wrench,
      trend: `${stats.totalBuilds} built total`,
      trendUp: true,
    },
    {
      title: 'Recent Activity',
      value: stats.recentTransactions.toString(),
      description: 'Transactions this week',
      icon: TrendingUp,
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: isAdmin ? stats.totalUsers.toString() : '—',
      description: isAdmin ? 'Registered accounts' : 'Admin only',
      icon: Users,
      trend: '+2 new',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="minimal-layout">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading dashboard...</p>
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
            <h1>Welcome back, {profile?.name}</h1>
            <p>Here's what's happening with your inventory today.</p>
          </div>

          <div className="flex gap-2">
            <button className="github-button github-button-sm">
              <QrCode className="h-3 w-3 mr-1" />
              Scan QR
            </button>
            {isAdmin && (
              <button className="github-button github-button-primary github-button-sm">
                <Plus className="h-3 w-3 mr-1" />
                Add Part
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-stats">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-title">{stat.title}</div>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-description">{stat.description}</div>
              <div className="stat-card-trend">
                <span className={`clean-badge ${stat.trendUp ? 'clean-badge-active' : 'clean-badge-member'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <Clock className="h-4 w-4 text-gray-500" />
            <div className="dashboard-card-title">Recent Activity</div>
          </div>
          <div className="dashboard-card-description mb-3">Latest inventory and manufacturing activity</div>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`clean-badge ${
                      activity.type === 'checkout' ? 'clean-badge-active' :
                      activity.type === 'return' ? 'clean-badge-member' :
                      activity.type === 'build' ? 'clean-badge-admin' : 'clean-badge-restricted'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="font-medium text-xs">
                      {activity.part || activity.board}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.quantity > 0 ? '+' : ''}{activity.quantity} {activity.type === 'build' ? 'built' : 'units'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {activity.timestamp}
                </span>
              </div>
            ))}

            {recentActivity.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-xs">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">Quick Actions</div>
          </div>
          <div className="dashboard-card-description mb-3">Common tasks based on your role</div>
          <div className="grid gap-3 md:grid-cols-1">
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">Available to Everyone</h4>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start h-auto p-2">
                  <QrCode className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-xs">Scan QR Code</div>
                    <div className="text-xs text-gray-500">Check out or return parts</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-2">
                  <Package className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-xs">Browse Inventory</div>
                    <div className="text-xs text-gray-500">Search and view parts catalog</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-2">
                  <Hammer className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-xs">Build Boards</div>
                    <div className="text-xs text-gray-500">Manufacture PCB assemblies</div>
                  </div>
                </Button>
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-2 mt-3">
                <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide">Admin Functions</h4>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start h-auto p-2">
                    <Plus className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Add New Parts</div>
                      <div className="text-xs text-gray-500">Create inventory entries</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-2">
                    <Users className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Manage Users</div>
                      <div className="text-xs text-gray-500">User accounts and permissions</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}