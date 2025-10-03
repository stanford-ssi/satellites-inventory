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
import { Hammer, Package, QrCode } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
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
      // For consume, store negative quantity to differentiate from add stock
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
          <button
            type="button"
            className="github-button github-button-sm"
            onClick={() => router.push('/dashboard/scanner')}
          >
            <QrCode className="h-3 w-3 mr-1" />
            Scan QR
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Left Column - Part Info & Transaction */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <Hammer className="h-4 w-4 text-gray-500" />
              <div className="dashboard-card-title">Transaction</div>
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

              {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span>Loading part info...</span>
                </div>
              )}

              {/* Transaction Type */}
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

              {/* Quantity */}
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
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name or email"
                  required
                  disabled={!!profile?.email}
                  className="github-input text-xs h-8"
                />
                {profile?.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    Using logged-in account
                  </p>
                )}
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

        {/* Error Message */}
        {validationError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {validationError}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-3">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full md:w-auto h-8 text-xs"
          >
            {isSubmitting ? 'Processing...' : 'Complete Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
}