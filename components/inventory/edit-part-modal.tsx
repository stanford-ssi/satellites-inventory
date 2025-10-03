'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { Package, MapPin } from 'lucide-react';

interface InventoryItem {
  id: string;
  part_id: string;
  description: string;
  bin_id: string | null;
  location_within_bin: string | null;
  quantity: number;
  min_quantity: number;
  part_link: string | null;
  is_sensitive: boolean;
}

interface EditPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  part: InventoryItem | null;
}

export function EditPartModal({ isOpen, onClose, onSuccess, part }: EditPartModalProps) {
  const [description, setDescription] = useState('');
  const [binId, setBinId] = useState('');
  const [locationWithinBin, setLocationWithinBin] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('10');
  const [partLink, setPartLink] = useState('');
  const [isSensitive, setIsSensitive] = useState<string>('false');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate form when modal opens or part changes
  useEffect(() => {
    if (isOpen && part) {
      setDescription(part.description);
      setBinId(part.bin_id || '');
      setLocationWithinBin(part.location_within_bin || '');
      setQuantity(part.quantity.toString());
      setMinQuantity(part.min_quantity.toString());
      setPartLink(part.part_link || '');
      setIsSensitive(part.is_sensitive ? 'true' : 'false');
      setError('');
    }
  }, [isOpen, part]);

  const resetForm = () => {
    setDescription('');
    setBinId('');
    setLocationWithinBin('');
    setQuantity('0');
    setMinQuantity('10');
    setPartLink('');
    setIsSensitive('false');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Update the part
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          description: description,
          bin_id: binId || null,
          location_within_bin: locationWithinBin || null,
          quantity: parseInt(quantity),
          min_quantity: parseInt(minQuantity),
          part_link: partLink || null,
          is_sensitive: isSensitive === 'true'
        })
        .eq('id', part.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError(`Failed to update part: ${updateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Success
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update part:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = description && partLink;

  if (!part) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Part: {part.part_id}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Part ID - Read Only */}
          <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs text-gray-600">Part ID (cannot be changed):</p>
            <p className="text-sm font-mono font-bold text-gray-900">{part.part_id}</p>
          </div>

          {/* Part Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Part Details</label>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-900 mb-1">
                Name
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Part name"
                className="h-8 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="part-link" className="block text-xs font-semibold text-gray-900 mb-1">
                Part Link
              </label>
              <Input
                id="part-link"
                value={partLink}
                onChange={(e) => setPartLink(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">
                Sensitive Part?
              </label>
              <Select value={isSensitive} onValueChange={setIsSensitive}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No - Regular Part</SelectItem>
                  <SelectItem value="true">Yes - Restricted/Sensitive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & Quantity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Location & Quantity</label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="bin-id" className="block text-xs font-semibold text-gray-900 mb-1">
                  Bin ID
                </label>
                <Input
                  id="bin-id"
                  value={binId}
                  onChange={(e) => setBinId(e.target.value)}
                  placeholder="e.g., A1, B2"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-xs font-semibold text-gray-900 mb-1">
                  Location Within Bin
                </label>
                <Input
                  id="location"
                  value={locationWithinBin}
                  onChange={(e) => setLocationWithinBin(e.target.value)}
                  placeholder="e.g., Slot 3"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="quantity" className="block text-xs font-semibold text-gray-900 mb-1">
                  Current Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={0}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label htmlFor="min-quantity" className="block text-xs font-semibold text-gray-900 mb-1">
                  Min Quantity
                </label>
                <Input
                  id="min-quantity"
                  type="number"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  min={0}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 h-8 text-xs"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
