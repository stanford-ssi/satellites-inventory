'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { Hash, Package, MapPin } from 'lucide-react';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPartModal({ isOpen, onClose, onSuccess }: AddPartModalProps) {
  const [partType, setPartType] = useState<'internal' | 'external'>('internal');

  // Internal part fields
  const [subassemblyCode, setSubassemblyCode] = useState('');
  const [partCode, setPartCode] = useState('');
  const [revision, setRevision] = useState('');

  // External part field
  const [externalPartId, setExternalPartId] = useState('');

  // Common fields
  const [description, setDescription] = useState('');
  const [binId, setBinId] = useState('');
  const [locationWithinBin, setLocationWithinBin] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('10');
  const [partLink, setPartLink] = useState('');
  const [isSensitive, setIsSensitive] = useState<string>('false');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [highestPartInfo, setHighestPartInfo] = useState<{ partId: string; partCode: string; revision: string } | null>(null);

  // Generate the full part ID for internal parts
  const getGeneratedPartId = () => {
    if (partType === 'external') {
      return externalPartId;
    }

    if (!subassemblyCode || !partCode) {
      return '';
    }

    let partId = `${subassemblyCode}-${partCode}`;
    if (revision) {
      partId += `v${revision}`;
    }
    return partId;
  };

  const generatedPartId = getGeneratedPartId();

  // Fetch highest part number for the subassembly
  useEffect(() => {
    const fetchHighestPart = async () => {
      if (!subassemblyCode || !/^\d{2}$/.test(subassemblyCode)) {
        setHighestPartInfo(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('part_id')
          .like('part_id', `${subassemblyCode}-%`)
          .order('part_id', { ascending: false })
          .limit(1);

        if (error || !data || data.length === 0) {
          setHighestPartInfo(null);
          return;
        }

        const highestPartId = data[0].part_id;
        // Parse the part ID (format: XX-YYYYvZ.Z or XX-YYYY)
        const match = highestPartId.match(/^(\d{2})-(\d{4})(v(\d+\.\d+))?$/);
        if (match) {
          setHighestPartInfo({
            partId: highestPartId,
            partCode: match[2],
            revision: match[4] || ''
          });
        }
      } catch (err) {
        console.error('Error fetching highest part:', err);
      }
    };

    fetchHighestPart();
  }, [subassemblyCode]);

  const resetForm = () => {
    setPartType('internal');
    setSubassemblyCode('');
    setPartCode('');
    setRevision('');
    setExternalPartId('');
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
    setIsSubmitting(true);
    setError('');

    try {
      const finalPartId = partType === 'internal' ? generatedPartId : externalPartId;

      if (!finalPartId) {
        setError('Please provide a valid part number');
        setIsSubmitting(false);
        return;
      }

      // Validate internal part number format
      if (partType === 'internal') {
        if (!/^\d{2}$/.test(subassemblyCode)) {
          setError('Subassembly code must be exactly 2 digits (00-99)');
          setIsSubmitting(false);
          return;
        }
        if (!/^\d{4}$/.test(partCode)) {
          setError('Part code must be exactly 4 digits');
          setIsSubmitting(false);
          return;
        }
        if (revision && !/^\d+\.\d+$/.test(revision)) {
          setError('Revision must be in format X.Y (e.g., 1.0, 3.2)');
          setIsSubmitting(false);
          return;
        }

        // Validate part code is not more than 1 over the highest existing part
        if (highestPartInfo) {
          const highestCode = parseInt(highestPartInfo.partCode);
          const currentCode = parseInt(partCode);

          if (currentCode > highestCode + 1) {
            setError(`Part code ${partCode} is too high. Highest existing part code is ${highestPartInfo.partCode}. Use ${String(highestCode + 1).padStart(4, '0')} or lower.`);
            setIsSubmitting(false);
            return;
          }

          // If same part code, validate revision
          if (currentCode === highestCode && highestPartInfo.revision) {
            if (!revision) {
              setError(`Part code ${partCode} already exists with revision ${highestPartInfo.revision}. Please specify a revision.`);
              setIsSubmitting(false);
              return;
            }

            const highestRev = parseFloat(highestPartInfo.revision);
            const currentRev = parseFloat(revision);

            if (currentRev > highestRev + 0.1) {
              setError(`Revision ${revision} is too high. Highest existing revision is ${highestPartInfo.revision}. Use ${(highestRev + 0.1).toFixed(1)} or lower.`);
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      // Check if part already exists
      const { data: existingPart } = await supabase
        .from('inventory')
        .select('part_id')
        .eq('part_id', finalPartId)
        .single();

      if (existingPart) {
        setError(`Part ${finalPartId} already exists in inventory`);
        setIsSubmitting(false);
        return;
      }

      // Insert the new part
      console.log('Attempting to insert part:', finalPartId);
      const { data, error: insertError } = await supabase
        .from('inventory')
        .insert({
          part_id: finalPartId,
          description: description,
          bin_id: binId || null,
          location_within_bin: locationWithinBin || null,
          quantity: parseInt(quantity),
          min_quantity: parseInt(minQuantity),
          part_link: partLink || null,
          qr_code: `QR-${finalPartId}`,
          is_sensitive: isSensitive === 'true'
        })
        .select();

      console.log('Insert result:', { data, error: insertError });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Failed to add part: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Success
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to add part:', error);
      setError(error?.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = partType === 'internal'
    ? (subassemblyCode && partCode && description && partLink)
    : (externalPartId && description && partLink);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Part Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Part Number Type</label>
            </div>
            <Select value={partType} onValueChange={(value: any) => setPartType(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="external">External Vendor/Manufacturer</SelectItem>
                <SelectItem value="internal">Internal (XX-YYYYvZ.Z)</SelectItem>
              </SelectContent>
            </Select>

            {partType === 'internal' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="subassembly" className="block text-xs font-semibold text-gray-900 mb-1">
                      Subassembly Code
                    </label>
                    <Input
                      id="subassembly"
                      value={subassemblyCode}
                      onChange={(e) => setSubassemblyCode(e.target.value)}
                      placeholder="00-99"
                      maxLength={2}
                      className="h-8 text-xs font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">2 digits (e.g., 00=Z+, 01=Pycubed, 99=Harnesses)</p>
                  </div>
                  <div>
                    <label htmlFor="partcode" className="block text-xs font-semibold text-gray-900 mb-1">
                      Part Code
                    </label>
                    <Input
                      id="partcode"
                      value={partCode}
                      onChange={(e) => setPartCode(e.target.value)}
                      placeholder={highestPartInfo ? `${highestPartInfo.partCode} (highest)` : "0000-9999"}
                      maxLength={4}
                      className="h-8 text-xs font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">4 digits (e.g., 0024=tray)</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="revision" className="block text-xs font-semibold text-gray-900 mb-1">
                    Revision (Optional)
                  </label>
                  <Input
                    id="revision"
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder={highestPartInfo?.revision ? `${highestPartInfo.revision} (highest)` : "1.0"}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Format: X.Y (e.g., 1.0, 3.2)</p>
                </div>
                {generatedPartId && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-gray-600">Generated Part ID:</p>
                    <p className="text-sm font-mono font-bold text-blue-900">{generatedPartId}</p>
                    {highestPartInfo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Highest existing: {highestPartInfo.partId} (Code: {highestPartInfo.partCode}
                        {highestPartInfo.revision && `, Rev: ${highestPartInfo.revision}`})
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="external-part" className="block text-xs font-semibold text-gray-900 mb-1">
                  External Part Number
                </label>
                <Input
                  id="external-part"
                  value={externalPartId}
                  onChange={(e) => setExternalPartId(e.target.value)}
                  placeholder="e.g., STM32F407VGT6"
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-xs text-gray-500 mt-0.5">Vendor or manufacturer part number</p>
              </div>
            )}
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
                  Initial Quantity
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
              {isSubmitting ? 'Adding Part...' : 'Add Part to Inventory'}
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
