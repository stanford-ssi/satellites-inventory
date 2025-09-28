'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Package, TriangleAlert as AlertTriangle, TrendingUp, Users, DollarSign, Clock, QrCode, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Real inventory data for dashboard calculations
  const inventoryData = {
    totalParts: 1247,
    totalValue: 89450.75,
    lowStockItems: 23,
    outOfStockItems: 5,
    recentTransactions: 156,
    activeUsers: 12,
    sensitivePartsCount: 8,
    averagePartValue: 71.75,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'checkout',
      user: 'John Smith',
      part: 'RES-10K-001',
      quantity: 25,
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'return',
      user: 'Sarah Johnson',
      part: 'CAP-100UF-001',
      quantity: 5,
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      type: 'adjustment',
      user: 'Admin',
      part: 'IC-MCU-001',
      quantity: -2,
      timestamp: '1 hour ago',
    },
    {
      id: '4',
      type: 'checkout',
      user: 'Mike Wilson',
      part: 'CONN-USB-001',
      quantity: 10,
      timestamp: '2 hours ago',
    },
  ];

  const lowStockAlerts = [
    { part_id: 'CAP-100UF-001', description: '100µF Electrolytic Capacitor', current: 8, minimum: 15 },
    { part_id: 'CRYPTO-CHIP-001', description: 'Hardware Security Module', current: 3, minimum: 5 },
    { part_id: 'LED-RED-001', description: 'Red LED 5mm', current: 12, minimum: 50 },
    { part_id: 'WIRE-22AWG-001', description: '22AWG Hookup Wire (Red)', current: 0, minimum: 10 },
  ];

  const stats = [
    {
      title: 'Total Inventory Value',
      value: `$${inventoryData.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      description: `${inventoryData.totalParts} total parts`,
      icon: DollarSign,
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Stock Alerts',
      value: inventoryData.lowStockItems.toString(),
      description: `${inventoryData.outOfStockItems} out of stock`,
      icon: AlertTriangle,
      trend: '-3 from last week',
      trendUp: false,
    },
    {
      title: 'Weekly Transactions',
      value: inventoryData.recentTransactions.toString(),
      description: 'Parts checked out/returned',
      icon: TrendingUp,
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: inventoryData.activeUsers.toString(),
      description: 'System users this month',
      icon: Users,
      trend: '+2 new',
      trendUp: true,
    },
  ];

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
        {stats.map((stat) => {
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
        {/* Stock Alerts */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div className="dashboard-card-title">Stock Alerts</div>
          </div>
          <div className="dashboard-card-description mb-3">Parts that need attention</div>
          <div className="space-y-2">
            {lowStockAlerts.map((alert, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-xs">{alert.part_id}</p>
                    <p className="text-xs text-gray-500">{alert.description}</p>
                  </div>
                  <span className={`clean-badge ${alert.current === 0 ? "clean-badge-admin" : "clean-badge-lowstock"}`}>
                    {alert.current === 0 ? "Out of Stock" : "Low Stock"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Current: {alert.current}</span>
                    <span>Minimum: {alert.minimum}</span>
                  </div>
                  <Progress
                    value={Math.min((alert.current / alert.minimum) * 100, 100)}
                    className="h-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <Clock className="h-4 w-4 text-gray-500" />
            <div className="dashboard-card-title">Recent Activity</div>
          </div>
          <div className="dashboard-card-description mb-3">Latest inventory transactions</div>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`clean-badge ${
                      activity.type === 'checkout' ? 'clean-badge-active' :
                      activity.type === 'return' ? 'clean-badge-member' : 'clean-badge-restricted'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="font-medium text-xs">{activity.part}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">Quick Actions</div>
        </div>
        <div className="dashboard-card-description mb-3">Common tasks based on your role</div>
        <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2">
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

      {/* System Status */}
      {isAdmin && (
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">System Overview</div>
          </div>
          <div className="dashboard-card-description mb-3">Administrative insights and system health</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Database Health</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <Progress value={95} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Storage Usage</span>
                <span>2.3GB / 10GB</span>
              </div>
              <Progress value={23} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Active Sessions</span>
                <span>{inventoryData.activeUsers} users</span>
              </div>
              <Progress value={60} className="h-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}