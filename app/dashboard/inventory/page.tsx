'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Package, ExternalLink, QrCode, CreditCard as Edit, TriangleAlert as AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useInventory } from '@/lib/hooks/use-inventory';
import { useState } from 'react';

export default function InventoryPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory, loading, error } = useInventory();

  const visibleInventory = inventory.filter(item =>
    (item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockCount = visibleInventory.filter(item => item.quantity <= item.min_quantity).length;
  const totalValue = visibleInventory.reduce((sum, item) => sum + (item.quantity * 1.5), 0); // Estimated value

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error loading inventory</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">
            {visibleInventory.length} parts
            {isAdmin && (
              <span> • ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total value</span>
            )}
            {lowStockCount > 0 && (
              <span className="ml-2 text-red-600">
                • {lowStockCount} items low stock
              </span>
            )}
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" className="compact-button">
            <Plus className="h-4 w-4 mr-2" />
            Add New Part
          </Button>
        )}
      </div>

      <Card className="compact-card">
        <CardHeader className="compact-card-header">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Parts Inventory</CardTitle>
              <CardDescription className="text-sm">
                Complete parts catalog with location tracking and stock levels
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts or descriptions..."
                className="w-64 h-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="compact-card-content">
          <div className="rounded-md border">
            <Table className="compact-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Part ID</TableHead>
                  <TableHead className="min-w-[250px]">Description</TableHead>
                  <TableHead className="w-[80px]">Location</TableHead>
                  <TableHead className="w-[60px] text-right">Qty</TableHead>
                  <TableHead className="w-[60px] text-right">Min</TableHead>
                  {isAdmin && <TableHead className="w-[80px] text-right">Unit Cost</TableHead>}
                  {isAdmin && <TableHead className="w-[100px] text-right">Total Value</TableHead>}
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleInventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium text-sm">
                      {item.part_id}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {item.is_sensitive && !isAdmin ? (
                          <div className="text-muted-foreground italic">Restricted</div>
                        ) : (
                          <>
                            <div className="font-medium">{item.bin_id}</div>
                            <div className="text-muted-foreground">
                              {item.location_within_bin}
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.min_quantity}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right font-mono">
                        $1.50
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="text-right font-mono font-medium">
                        ${(item.quantity * 1.5).toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.is_sensitive && (
                          <Badge variant="destructive" className="text-xs">
                            RESTRICTED
                          </Badge>
                        )}
                        {item.quantity <= item.min_quantity && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        )}
                        {item.quantity > item.min_quantity && (
                          <Badge variant="secondary" className="text-xs">
                            In Stock
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <QrCode className="h-3 w-3" />
                        </Button>
                        {item.part_link && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                            <a href={item.part_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {visibleInventory.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No parts found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No inventory items available'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}