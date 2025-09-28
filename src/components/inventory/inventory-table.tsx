'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, ExternalLink } from 'lucide-react'
import { Database } from '@/types/database'
import AddPartDialog from './add-part-dialog'
import EditPartDialog from './edit-part-dialog'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface InventoryTableProps {
  inventory: InventoryItem[]
  userRole: 'admin' | 'member'
}

export default function InventoryTable({ inventory, userRole }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [binFilter, setBinFilter] = useState<string>('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPart, setEditingPart] = useState<InventoryItem | null>(null)

  // Get unique bin IDs for filter dropdown
  const uniqueBins = Array.from(new Set(inventory.map(item => item.bin_id))).sort()

  // Filter inventory based on search and bin filter
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_within_bin.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBin = binFilter === '' || item.bin_id === binFilter

    return matchesSearch && matchesBin
  })

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const }
    if (quantity <= 10) return { label: 'Low Stock', variant: 'secondary' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory parts and stock levels
              </CardDescription>
            </div>
            {userRole === 'admin' && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts, descriptions, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={binFilter} onValueChange={setBinFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by bin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All bins</SelectItem>
                {uniqueBins.map((bin) => (
                  <SelectItem key={bin} value={bin}>
                    Bin {bin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Link</TableHead>
                  {userRole === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="text-center py-8">
                      {inventory.length === 0
                        ? 'No inventory items found. Add your first part to get started.'
                        : 'No items match your search criteria.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item.quantity)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.part_id}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Bin {item.bin_id}</div>
                            <div className="text-muted-foreground">{item.location_within_bin}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.part_link ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={item.part_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {userRole === 'admin' && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPart(item)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddPartDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditPartDialog
        part={editingPart}
        open={!!editingPart}
        onOpenChange={(open) => !open && setEditingPart(null)}
      />
    </div>
  )
}