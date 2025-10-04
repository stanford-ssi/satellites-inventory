'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { Package, User } from 'lucide-react';

interface UsePartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  partId?: string;
  userEmail?: string;
}

export function UsePartsModal({ isOpen, onClose, onSuccess, partId: initialPartId, userEmail }: UsePartsModalProps) {
  const [partId, setPartId] = useState('');
  const [transactionType, setTransactionType] = useState<'take' | 'consume'>('take');
  const [quantity, setQuantity] = useState('1');
  const [userName, setUserName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPartId(initialPartId || '');
      setUserName(userEmail || '');
      setTransactionType('take');
      setQuantity('1');
      setNotes('');
      setValidationError('');

      if (initialPartId) {
        fetchPartInfo(initialPartId);
      }
    }
  }, [isOpen, initialPartId, userEmail]);

  // Fetch part info when part ID changes
  useEffect(() => {
    if (partId && isOpen) {
      fetchPartInfo(partId);
    }
  }, [partId, isOpen]);

  const fetchPartInfo = async (pid: string) => {
    setLoading(true);
    try {
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity, part_id')
        .eq('part_id', pid)
        .single();

      if (!inventoryError && inventoryItem) {
        setAvailableQuantity(inventoryItem.quantity);
      } else {
        setAvailableQuantity(null);
      }
    } catch (error) {
      console.error('Error fetching part info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError('');

    try {
      const requestedQuantity = parseInt(quantity);

      // Get the inventory item
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity, part_id')
        .eq('part_id', partId)
        .single();

      if (inventoryError || !inventoryItem) {
        setValidationError('Part not found in inventory. Please check the part number.');
        setIsSubmitting(false);
        return;
      }

      // Validation
      if (requestedQuantity > inventoryItem.quantity) {
        setValidationError(`Cannot ${transactionType === 'take' ? 'check out' : 'consume'} ${requestedQuantity} items. Only ${inventoryItem.quantity} currently available in inventory.`);
        setIsSubmitting(false);
        return;
      }

      // Get or create user
      let userId: string | undefined;

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userName.toLowerCase())
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create guest user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: userName.toLowerCase(),
            name: userName,
            role: 'member',
            auth_id: ''
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Failed to create user:', userError);
          setValidationError('Failed to create user record. Please try again.');
          setIsSubmitting(false);
          return;
        }

        userId = newUser.id;
      }

      // Map transaction type
      const transactionTypeMap = {
        'take': 'checkout',
        'consume': 'adjustment'
      } as const;

      // Create transaction
      const transactionQuantity = transactionType === 'consume'
        ? -parseInt(quantity)
        : parseInt(quantity);

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          part_id: inventoryItem.id,
          user_id: userId,
          type: transactionTypeMap[transactionType],
          quantity: transactionQuantity,
          notes: notes || null
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        setValidationError('Failed to create transaction. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Update inventory
      const quantityChange = -parseInt(quantity);

      const { error: inventoryUpdateError } = await supabase.rpc(
        'update_inventory_quantity',
        {
          inventory_id: inventoryItem.id,
          quantity_change: quantityChange
        }
      );

      if (inventoryUpdateError && inventoryUpdateError.message.includes('function')) {
        const { data: currentInventory } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('id', inventoryItem.id)
          .single();

        if (currentInventory) {
          await supabase
            .from('inventory')
            .update({ quantity: currentInventory.quantity + quantityChange })
            .eq('id', inventoryItem.id);
        }
      }

      // Success
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = partId && quantity && parseInt(quantity) > 0 && userName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use Parts</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Part Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Transaction</label>
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

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Loading part info...</span>
              </div>
            )}

            <div>
              <label htmlFor="transaction-type" className="block text-xs font-semibold text-gray-900 mb-1">
                Type
              </label>
              <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                <SelectTrigger id="transaction-type" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="take">Check Out</SelectItem>
                  <SelectItem value="consume">Consume</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-xs font-semibold text-gray-900 mb-1">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[availableQuantity !== null ? Math.min(parseInt(quantity) || 1, Math.max(1, availableQuantity)) : 1]}
                  onValueChange={(value) => setQuantity(value[0].toString())}
                  min={1}
                  max={availableQuantity !== null ? Math.max(1, availableQuantity) : 10}
                  step={1}
                  className="flex-1 px-3"
                  disabled={!availableQuantity || availableQuantity === 0}
                />
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const maxQty = Math.max(1, availableQuantity || 1);
                    if (!isNaN(val) && val >= 1 && val <= maxQty) {
                      setQuantity(e.target.value);
                    } else if (e.target.value === '') {
                      setQuantity('');
                    }
                  }}
                  min={1}
                  max={Math.max(1, availableQuantity || 1)}
                  className="w-16 h-8 text-xs text-center font-mono"
                  required
                  disabled={!availableQuantity || availableQuantity === 0}
                />
              </div>
              {availableQuantity === 0 && (
                <p className="text-xs text-red-600 mt-1">No items available</p>
              )}
              {availableQuantity !== null && availableQuantity > 0 && (
                <p className="text-xs text-gray-500 mt-1">{availableQuantity} available</p>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">User & Notes</label>
            </div>

            <div>
              <label htmlFor="user-name" className="block text-xs font-semibold text-gray-900 mb-1">
                Your Name / Email
              </label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name or email"
                required
                className="h-8 text-xs"
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
              {isSubmitting ? 'Processing...' : 'Complete Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
