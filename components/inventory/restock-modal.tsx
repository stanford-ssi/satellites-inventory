'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { PackagePlus } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  partId?: string;
  userId?: string;
}

export function RestockModal({ isOpen, onClose, onSuccess, partId: initialPartId, userId }: RestockModalProps) {
  const [partId, setPartId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPartId(initialPartId || '');
      setQuantity('');
      setNotes('');
      setValidationError('');
    }
  }, [isOpen, initialPartId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError('');

    try {
      // Get the inventory item
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('part_id', partId)
        .single();

      if (inventoryError || !inventoryItem) {
        setValidationError('Part not found in inventory. Please check the part number.');
        setIsSubmitting(false);
        return;
      }

      if (!userId) {
        setValidationError('You must be logged in as an admin to restock.');
        setIsSubmitting(false);
        return;
      }

      const quantityToAdd = parseInt(quantity);

      // Create the adjustment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          part_id: inventoryItem.id,
          user_id: userId,
          type: 'adjustment',
          quantity: quantityToAdd,
          notes: notes || null
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        setValidationError('Failed to create transaction. Please try again.');
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
        setValidationError('Failed to update inventory. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to restock:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = partId && quantity && parseInt(quantity) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restock Part</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Stock Addition</label>
            </div>

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
                className="h-8 text-xs font-mono"
                disabled={!!initialPartId}
              />
            </div>

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
                className="h-8 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-gray-900 mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {validationError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {validationError}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 h-8 text-xs"
            >
              {isSubmitting ? 'Processing...' : 'Restock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
