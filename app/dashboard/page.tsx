'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Users, Clock, QrCode, Plus, Hammer, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { stats, recentActivity, loading, error } = useDashboard();
  const router = useRouter();

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

  if (error) {
    return (
      <div className="minimal-layout">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500">Error loading dashboard: {error}</p>
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
            <button
              className="github-button github-button-sm"
              onClick={() => router.push('/dashboard/scanner')}
            >
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
            {recentActivity.map((activity) => {
              const isConsume = activity.type === 'adjustment' && activity.quantity < 0;
              const displayType = isConsume ? 'consume' : activity.type;
              const badgeClass =
                activity.type === 'checkout' ? 'clean-badge-active' :
                activity.type === 'return' ? 'clean-badge-checkin' :
                activity.type === 'build' ? 'clean-badge-admin' :
                isConsume ? 'clean-badge-checkout' : 'clean-badge-restricted';

              return (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`clean-badge ${badgeClass}`}>
                        {displayType}
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
              );
            })}

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
                <Button
                  variant="outline"
                  className="justify-start h-auto p-2"
                  onClick={() => router.push('/dashboard/scanner')}
                >
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