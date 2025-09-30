'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PackagePlus } from 'lucide-react';

export default function AddStockPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const partIdFromUrl = searchParams.get('part');

  const [partId, setPartId] = useState(partIdFromUrl || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the inventory item by part_id
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('part_id', partId)
        .single();

      if (inventoryError || !inventoryItem) {
        alert('Part not found in inventory. Please check the part number.');
        setIsSubmitting(false);
        return;
      }

      if (!profile?.id) {
        alert('You must be logged in as an admin to add stock.');
        setIsSubmitting(false);
        return;
      }

      const quantityToAdd = parseInt(quantity);

      // Create the adjustment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          part_id: inventoryItem.id,
          user_id: profile.id,
          type: 'adjustment',
          quantity: quantityToAdd,
          notes: notes || null
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        alert('Failed to create transaction. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Update inventory quantity
      const { error: inventoryUpdateError } = await supabase
        .from('inventory')
        .update({ quantity: inventoryItem.quantity + quantityToAdd })
        .eq('id', inventoryItem.id);

      if (inventoryUpdateError) {
        console.error('Inventory update error:', inventoryUpdateError);
        alert('Failed to update inventory. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to inventory page
      router.push('/dashboard/inventory');
    } catch (error) {
      console.error('Failed to add stock:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = partId && quantity && parseInt(quantity) > 0;

  if (profile && profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>Add Stock</h1>
            <p>Add inventory quantity (Admin Only)</p>
          </div>
        </div>
      </div>

      <div className="clean-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Part ID */}
          <div className="space-y-2">
            <Label htmlFor="part-id">Part Number</Label>
            <Input
              id="part-id"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              placeholder="e.g., CAP-100UF-001"
              required
              className="font-mono"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to add"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this stock addition (e.g., purchase order, supplier)..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Processing...' : 'Add Stock'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>

        {!isValid && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Please fill in all required fields to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}