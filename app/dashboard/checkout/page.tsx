'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [transactionType, setTransactionType] = useState<'take' | 'return' | 'add'>('take');
  const [quantity, setQuantity] = useState('');
  const [userName, setUserName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.email) {
      setUserName(profile.email);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, get the inventory item by part_id to get its UUID
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('part_id', partId)
        .single();

      if (inventoryError || !inventoryItem) {
        alert('Part not found in inventory. Please check the part number.');
        setIsSubmitting(false);
        return;
      }

      // Get or create user by name/email
      let userId = profile?.id; // Use logged-in user if available

      if (!userId) {
        // For anonymous users, try to find existing user by email or create a guest entry
        // For now, we'll use a placeholder approach - you may want to handle this differently
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', userName.toLowerCase())
          .single();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create a guest user entry (you may need to adjust RLS policies for this)
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
            alert('Failed to create user record. Please try again or log in.');
            setIsSubmitting(false);
            return;
          }

          userId = newUser.id;
        }
      }

      // Map transaction type to database enum
      const transactionTypeMap = {
        'take': 'checkout',
        'return': 'return',
        'add': 'adjustment'
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
        alert('Failed to create transaction. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Update inventory quantity
      const quantityChange = transactionType === 'take' ? -parseInt(quantity) :
                             transactionType === 'return' ? parseInt(quantity) :
                             parseInt(quantity); // adjustment

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

      // Success - redirect to transactions page
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      alert('An unexpected error occurred. Please try again.');
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
            <h1>Checkout</h1>
            <p>Complete your transaction</p>
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

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
              <SelectTrigger id="transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="take">Checking Out</SelectItem>
                <SelectItem value="return">Returning</SelectItem>
                <SelectItem value="add">Adding to Inventory [admin only]</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
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
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Processing...' : 'Complete Transaction'}
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