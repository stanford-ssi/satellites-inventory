'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Package, ExternalLink, QrCode, CreditCard as Edit, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState } from 'react';

export default function InventoryPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data with realistic inventory items
  const inventory = [
    {
      id: '1',
      part_id: 'RES-10K-001',
      description: '10kΩ Resistor - 1/4W Carbon Film',
      bin_id: 'A1',
      location_within_bin: 'Slot 3',
      quantity: 150,
      min_quantity: 25,
      part_link: 'https://www.digikey.com/product-detail/en/yageo/CFR-25JB-52-10K/10KQBK-ND/338',
      qr_code: 'QR-RES-10K-001',
      is_sensitive: false,
      last_updated: '2024-01-15',
      cost_per_unit: 0.12,
    },
    {
      id: '2',
      part_id: 'GPS-NAV-001',
      description: 'GPS Navigation Module - Military Grade (ITAR Controlled)',
      bin_id: 'S1',
      location_within_bin: 'Secure Cabinet A',
      quantity: 5,
      min_quantity: 2,
      part_link: 'https://internal-catalog.company.com/gps-nav-001',
      qr_code: 'QR-GPS-NAV-001',
      is_sensitive: true,
      last_updated: '2024-01-10',
      cost_per_unit: 2450.00,
    },
    {
      id: '3',
      part_id: 'CAP-100UF-001',
      description: '100µF Electrolytic Capacitor 25V',
      bin_id: 'B2',
      location_within_bin: 'Slot 1',
      quantity: 8,
      min_quantity: 15,
      part_link: 'https://www.mouser.com/ProductDetail/Panasonic/ECA-1EM101',
      qr_code: 'QR-CAP-100UF-001',
      is_sensitive: false,
      last_updated: '2024-01-12',
      cost_per_unit: 0.85,
    },
    {
      id: '4',
      part_id: 'IC-MCU-001',
      description: 'STM32F407VGT6 ARM Cortex-M4 Microcontroller',
      bin_id: 'C3',
      location_within_bin: 'Anti-static tray 2',
      quantity: 25,
      min_quantity: 10,
      part_link: 'https://www.st.com/en/microcontrollers-microprocessors/stm32f407vg.html',
      qr_code: 'QR-IC-MCU-001',
      is_sensitive: false,
      last_updated: '2024-01-14',
      cost_per_unit: 12.50,
    },
    {
      id: '5',
      part_id: 'CONN-USB-001',
      description: 'USB-C Connector - Right Angle SMD',
      bin_id: 'D1',
      location_within_bin: 'Drawer 3',
      quantity: 45,
      min_quantity: 20,
      part_link: 'https://www.amphenol-icc.com/usb-c-connector-12401548e4-2a',
      qr_code: 'QR-CONN-USB-001',
      is_sensitive: false,
      last_updated: '2024-01-13',
      cost_per_unit: 3.25,
    },
    {
      id: '6',
      part_id: 'CRYPTO-CHIP-001',
      description: 'Hardware Security Module - FIPS 140-2 Level 3 (Export Restricted)',
      bin_id: 'S2',
      location_within_bin: 'Secure Cabinet B',
      quantity: 3,
      min_quantity: 5,
      part_link: 'https://internal-catalog.company.com/crypto-chip-001',
      qr_code: 'QR-CRYPTO-CHIP-001',
      is_sensitive: true,
      last_updated: '2024-01-08',
      cost_per_unit: 1850.00,
    },
  ];

  const visibleInventory = inventory.filter(item => 
    (!item.is_sensitive || isAdmin) &&
    (item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockCount = visibleInventory.filter(item => item.quantity <= item.min_quantity).length;
  const totalValue = visibleInventory.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            {visibleInventory.length} parts • ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} total value
            {lowStockCount > 0 && (
              <span className="ml-2 text-orange-600">
                • {lowStockCount} items low stock
              </span>
            )}
          </p>
        </div>
        
        {isAdmin && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Part
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parts Inventory</CardTitle>
              <CardDescription>
                Complete parts catalog with location tracking and stock levels
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search parts or descriptions..." 
                className="w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Part ID</TableHead>
                  <TableHead className="min-w-[300px]">Description</TableHead>
                  <TableHead className="w-[100px]">Location</TableHead>
                  <TableHead className="w-[80px] text-right">Qty</TableHead>
                  <TableHead className="w-[80px] text-right">Min</TableHead>
                  <TableHead className="w-[100px] text-right">Unit Cost</TableHead>
                  <TableHead className="w-[120px] text-right">Total Value</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleInventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">
                      {item.part_id}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {item.last_updated}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{item.bin_id}</div>
                        <div className="text-muted-foreground text-xs">
                          {item.location_within_bin}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.min_quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.cost_per_unit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ${(item.quantity * item.cost_per_unit).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.is_sensitive && (
                          <Badge variant="destructive" className="text-xs">
                            RESTRICTED
                          </Badge>
                        )}
                        {item.quantity <= item.min_quantity && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {item.part_link && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                            <a href={item.part_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
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