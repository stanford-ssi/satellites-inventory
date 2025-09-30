'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

export default function CheckoutPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const partIdFromUrl = searchParams.get('part');

  const [partId, setPartId] = useState(partIdFromUrl || '');
  const [transactionType, setTransactionType] = useState<'take' | 'consume'>('take');
  const [quantity, setQuantity] = useState('1');
  const [userName, setUserName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [userCheckedOutQuantity, setUserCheckedOutQuantity] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (profile?.email) {
      setUserName(profile.email);
    }
  }, [profile]);

  // Fetch available quantity and user's checked out quantity when part ID changes
  useEffect(() => {
    if (partId) {
      fetchPartInfo();
    }
  }, [partId, userName]);

  const fetchPartInfo = async () => {
    try {
      // Get inventory quantity
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity, part_id')
        .eq('part_id', partId)
        .single();

      if (!inventoryError && inventoryItem) {
        setAvailableQuantity(inventoryItem.quantity);

        // Calculate user's net checked out quantity
        if (userName) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('email', userName.toLowerCase())
            .single();

          if (userRecord) {
            const { data: transactions } = await supabase
              .from('transactions')
              .select('type, quantity')
              .eq('part_id', inventoryItem.id)
              .eq('user_id', userRecord.id);

            if (transactions) {
              let netCheckout = 0;
              transactions.forEach(t => {
                if (t.type === 'checkout') {
                  netCheckout += t.quantity;
                } else if (t.type === 'return') {
                  netCheckout -= t.quantity;
                }
              });
              setUserCheckedOutQuantity(netCheckout);
            }
          } else {
            setUserCheckedOutQuantity(0);
          }
        }
      } else {
        setAvailableQuantity(null);
        setUserCheckedOutQuantity(0);
      }
    } catch (error) {
      console.error('Error fetching part info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError('');

    try {
      const requestedQuantity = parseInt(quantity);

      // First, get the inventory item by part_id to get its UUID and current quantity
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

      // Get or create user by name/email to get userId for validation
      let userId = profile?.id;

      if (!userId) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', userName.toLowerCase())
          .single();

        if (existingUser) {
          userId = existingUser.id;
        }
      }

      // VALIDATION: For checkout and consume, check against current inventory
      if (transactionType === 'take' || transactionType === 'consume') {
        if (requestedQuantity > inventoryItem.quantity) {
          setValidationError(`Cannot ${transactionType === 'take' ? 'check out' : 'consume'} ${requestedQuantity} items. Only ${inventoryItem.quantity} currently available in inventory.`);
          setIsSubmitting(false);
          return;
        }
      }

      // All validations passed, now proceed with the transaction

      // Get or create user by name/email for transaction record
      if (!userId) {
        // Create a guest user entry if they don't exist
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: userName.toLowerCase(),
            name: userName,
            role: 'member',
            auth_id: '' // Guest user without auth
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Failed to create user:', userError);
          setValidationError('Failed to create user record. Please try again or log in.');
          setIsSubmitting(false);
          return;
        }

        userId = newUser.id;
      }

      // Map transaction type to database enum
      const transactionTypeMap = {
        'take': 'checkout',
        'consume': 'adjustment'
      } as const;

      // Create the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          part_id: inventoryItem.id,
          user_id: userId,
          type: transactionTypeMap[transactionType],
          quantity: parseInt(quantity),
          notes: notes || null
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        setValidationError('Failed to create transaction. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Update inventory quantity (both checkout and consume reduce inventory)
      const quantityChange = -parseInt(quantity);

      const { error: inventoryUpdateError } = await supabase.rpc(
        'update_inventory_quantity',
        {
          inventory_id: inventoryItem.id,
          quantity_change: quantityChange
        }
      );

      // If the RPC doesn't exist, fall back to direct update
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

      // Success - redirect to my items page
      router.push('/dashboard/my-items');
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = partId && quantity && parseInt(quantity) > 0 && userName;

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>Check Out / Use Items</h1>
            <p>Check out items to borrow or mark items as used</p>
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

          {/* Show inventory info */}
          {availableQuantity !== null && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-900 font-medium">Available in inventory:</span>
                <span className="text-blue-700 font-bold">{availableQuantity}</span>
              </div>
              {userCheckedOutQuantity > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-900 font-medium">You currently have checked out:</span>
                  <span className="text-orange-600 font-bold">{userCheckedOutQuantity}</span>
                </div>
              )}
            </div>
          )}

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
              <SelectTrigger id="transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="take">Check Out</SelectItem>
                <SelectItem value="consume">Use (permanent)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-4">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  value={[Math.min(parseInt(quantity) || 1, Math.max(1, availableQuantity || 1))]}
                  onValueChange={(value) => setQuantity(value[0].toString())}
                  min={1}
                  max={Math.max(1, availableQuantity || 1)}
                  step={1}
                  className="flex-1"
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
                  className="w-20"
                  required
                  disabled={!availableQuantity || availableQuantity === 0}
                />
              </div>
              {availableQuantity === 0 && (
                <p className="text-sm text-red-600">
                  No items available in inventory
                </p>
              )}
            </div>
          </div>

          {/* User Name */}
          <div className="space-y-2">
            <Label htmlFor="user-name">Your Name / Email</Label>
            <Input
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name or email"
              required
              disabled={!!profile?.email}
            />
            {profile?.email && (
              <p className="text-xs text-muted-foreground">
                Using your logged-in account
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this transaction..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : 'Complete Transaction'}
            </Button>
          </div>
        </form>

        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">
              {validationError}
            </p>
          </div>
        )}

        {!isValid && !validationError && (
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