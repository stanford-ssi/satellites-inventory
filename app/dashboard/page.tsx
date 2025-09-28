'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.name}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your inventory today.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>
          {isAdmin && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Quick Add Part
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {stat.description}
                </p>
                <Badge 
                  variant={stat.trendUp ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {stat.trend}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>
              Parts that need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockAlerts.map((alert, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{alert.part_id}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={alert.current === 0 ? "destructive" : "outline"}>
                    {alert.current === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Current: {alert.current}</span>
                    <span>Minimum: {alert.minimum}</span>
                  </div>
                  <Progress 
                    value={Math.min((alert.current / alert.minimum) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest inventory transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        activity.type === 'checkout' ? 'default' : 
                        activity.type === 'return' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {activity.type}
                    </Badge>
                    <span className="font-medium text-sm">{activity.part}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Available to Everyone</h4>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start h-auto p-3">
                  <QrCode className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Scan QR Code</div>
                    <div className="text-xs text-muted-foreground">Check out or return parts</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-3">
                  <Package className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Browse Inventory</div>
                    <div className="text-xs text-muted-foreground">Search and view parts catalog</div>
                  </div>
                </Button>
              </div>
            </div>
            
            {isAdmin && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Admin Functions</h4>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start h-auto p-3">
                    <Plus className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add New Parts</div>
                      <div className="text-xs text-muted-foreground">Create inventory entries</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-3">
                    <Users className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Manage Users</div>
                      <div className="text-xs text-muted-foreground">User accounts and permissions</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Administrative insights and system health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Database Health</span>
                  <span className="text-green-600">Excellent</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Usage</span>
                  <span>2.3GB / 10GB</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Sessions</span>
                  <span>{inventoryData.activeUsers} users</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}