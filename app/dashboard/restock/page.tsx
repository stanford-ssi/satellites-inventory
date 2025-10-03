'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PackagePlus, Package, Plus } from 'lucide-react';
import { AddPartModal } from '@/components/inventory/add-part-modal';

export default function AddStockPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const partIdFromUrl = searchParams.get('part');

  const [partId, setPartId] = useState(partIdFromUrl || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addPartModalOpen, setAddPartModalOpen] = useState(false);

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
        alert('You must be logged in as an admin to restock.');
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
      console.error('Failed to restock:', error);
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
            <h1>Restock</h1>
            <p>Add inventory quantity (Admin Only)</p>
          </div>
          <button
            type="button"
            className="github-button github-button-primary github-button-sm"
            onClick={() => setAddPartModalOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add New Part
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Left Column - Part Info & Quantity */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <PackagePlus className="h-4 w-4 text-gray-500" />
              <div className="dashboard-card-title">Stock Addition</div>
            </div>

            <div className="space-y-2.5 mt-3">
              {/* Part ID Input */}
              <div>
                <label htmlFor="part-id" className="block text-xs font-semibold text-gray-900 mb-1">
                  Part Number
                </label>
                <Input
                  id="part-id"
                  value={partId}
                  onChange={(e) => setPartId(e.target.value)}
                  placeholder="e.g., CAP-100UF-001"
                  required
                  className="github-input font-mono text-xs h-8"
                />
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-xs font-semibold text-gray-900 mb-1">
                  Quantity to Add
                </label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min={1}
                  className="github-input text-xs h-8"
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Column - User Info & Notes */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <Package className="h-4 w-4 text-gray-500" />
              <div className="dashboard-card-title">User & Notes</div>
            </div>

            <div className="space-y-2.5 mt-3">
              {/* User Name */}
              <div>
                <label htmlFor="user-name" className="block text-xs font-semibold text-gray-900 mb-1">
                  Your Name / Email
                </label>
                <Input
                  id="user-name"
                  value={profile?.email || 'Admin'}
                  disabled
                  className="github-input text-xs h-8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Using logged-in account
                </p>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-xs font-semibold text-gray-900 mb-1">
                  Notes (Optional)
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-3">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full md:w-auto h-8 text-xs"
          >
            {isSubmitting ? 'Processing...' : 'Restock'}
          </Button>
        </div>
      </form>

      <AddPartModal
        isOpen={addPartModalOpen}
        onClose={() => setAddPartModalOpen(false)}
      />
    </div>
  );
}