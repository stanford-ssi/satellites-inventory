'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Package } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MyItem {
  part_id: string;
  inventory_id: string;
  description: string;
  quantity_checked_out: number;
  last_checkout_date: string;
}

export default function MyItemsPage() {
  const { profile } = useAuth();
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MyItem | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchMyItems();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchMyItems = async () => {
    if (!profile?.id) return;

    try {
      // Fetch all transactions for this user
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          quantity,
          timestamp,
          inventory:part_id (
            id,
            part_id,
            description
          )
        `)
        .eq('user_id', profile.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
        return;
      }

      // Calculate net checked out per part
      const itemsMap = new Map<string, MyItem>();

      transactions?.forEach((transaction: any) => {
        const inventoryId = transaction.inventory?.id;
        const partId = transaction.inventory?.part_id;

        if (!inventoryId || !partId) return;

        if (!itemsMap.has(inventoryId)) {
          itemsMap.set(inventoryId, {
            part_id: partId,
            inventory_id: inventoryId,
            description: transaction.inventory?.description || 'N/A',
            quantity_checked_out: 0,
            last_checkout_date: transaction.timestamp
          });
        }

        const item = itemsMap.get(inventoryId)!;

        if (transaction.type === 'checkout') {
          item.quantity_checked_out += transaction.quantity;
          item.last_checkout_date = transaction.timestamp;
        } else if (transaction.type === 'return') {
          item.quantity_checked_out -= transaction.quantity;
        }
      });

      // Filter to only items with quantity > 0
      const checkedOutItems = Array.from(itemsMap.values())
        .filter(item => item.quantity_checked_out > 0);

      setMyItems(checkedOutItems);
    } catch (error) {
      console.error('Error fetching my items:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReturnDialog = (item: MyItem) => {
    setSelectedItem(item);
    setReturnQuantity(item.quantity_checked_out);
    setShowReturnDialog(true);
  };

  const handleReturn = async () => {
    if (!profile?.id || !selectedItem) return;

    setIsReturning(true);

    try {
      // Create return transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          part_id: selectedItem.inventory_id,
          user_id: profile.id,
          type: 'return',
          quantity: returnQuantity,
          notes: 'Return from My Items'
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        alert('Failed to return items. Please try again.');
        setIsReturning(false);
        return;
      }

      // Update inventory quantity
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', selectedItem.inventory_id)
        .single();

      if (currentInventory) {
        await supabase
          .from('inventory')
          .update({ quantity: currentInventory.quantity + returnQuantity })
          .eq('id', selectedItem.inventory_id);
      }

      // Close dialog and refresh the list
      setShowReturnDialog(false);
      setSelectedItem(null);
      await fetchMyItems();
    } catch (error) {
      console.error('Failed to return items:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsReturning(false);
    }
  };

  if (!profile) {
    return (
      <div className="minimal-layout">
        <div className="minimal-header">
          <h1>My Items</h1>
          <p>Items you currently have checked out</p>
        </div>
        <div className="clean-card">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Please log in</h3>
            <p className="text-gray-500">You need to be logged in to view your checked out items</p>
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
            <h1>My Items</h1>
            <p>{myItems.length} {myItems.length === 1 ? 'item' : 'items'} checked out</p>
          </div>
        </div>
      </div>

      <div className="clean-card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your items...</p>
          </div>
        ) : (
          <>
            {myItems.length > 0 ? (
              <table className="github-table">
                <thead>
                  <tr>
                    <th style={{width: '140px'}}>Part ID</th>
                    <th style={{minWidth: '300px'}}>Description</th>
                    <th style={{width: '100px'}} className="text-right">Qty Out</th>
                    <th style={{width: '150px'}}>Checked Out</th>
                    <th style={{width: '80px'}} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myItems.map((item) => (
                    <tr key={item.inventory_id}>
                      <td className="font-mono font-medium">
                        {item.part_id}
                      </td>
                      <td>
                        <div className="font-medium">{item.description}</div>
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-mono font-medium">
                          {item.quantity_checked_out}
                        </span>
                      </td>
                      <td className="text-sm">
                        {new Date(item.last_checkout_date).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => openReturnDialog(item)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No items checked out</h3>
                <p className="text-gray-500">You don't have any items currently checked out</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Items</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Returning <span className="font-mono font-semibold">{selectedItem.part_id}</span>
                  <br />
                  <span className="text-sm">{selectedItem.description}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Quantity to Return</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[returnQuantity]}
                  onValueChange={(value) => setReturnQuantity(value[0])}
                  min={1}
                  max={selectedItem?.quantity_checked_out || 1}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={returnQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= (selectedItem?.quantity_checked_out || 1)) {
                      setReturnQuantity(val);
                    }
                  }}
                  min={1}
                  max={selectedItem?.quantity_checked_out || 1}
                  className="w-20"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                You have {selectedItem?.quantity_checked_out} checked out
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReturnDialog(false)}
              disabled={isReturning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturn}
              disabled={isReturning}
            >
              {isReturning ? 'Returning...' : `Return ${returnQuantity}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}