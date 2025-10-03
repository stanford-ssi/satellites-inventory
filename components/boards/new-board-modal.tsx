'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Plus, Trash2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase/client';

interface BOMRow {
  references: string;
  value: string;
  footprint: string;
  quantity: number;
  partId: string;
  partName: string;
  binId: string;
  locationWithinBin: string;
  minQuantity: number;
  isSensitive: boolean;
  partLink: string;
}

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId?: string;
}

export function NewBoardModal({ isOpen, onClose, onSuccess, userId }: NewBoardModalProps) {
  const [step, setStep] = useState<'upload' | 'edit'>('upload');
  const [boardName, setBoardName] = useState('');
  const [boardVersion, setBoardVersion] = useState('1.0');
  const [boardDescription, setBoardDescription] = useState('');
  const [bomRows, setBomRows] = useState<BOMRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];

        // Parse CSV rows
        const parsedRows: BOMRow[] = data.map(row => ({
          references: row.References || '',
          value: row.Value || '',
          footprint: row.Footprint || '',
          quantity: parseInt(row.Quantity) || 0,
          partId: row.Value || '', // Pre-fill with value if it looks like a part number
          partName: '',
          binId: '',
          locationWithinBin: '',
          minQuantity: 5,
          isSensitive: false,
          partLink: ''
        }));

        // Try to auto-match existing inventory parts
        const matchedRows = await Promise.all(
          parsedRows.map(async (row) => {
            // Search inventory by value or footprint
            const { data: matches } = await supabase
              .from('inventory')
              .select('part_id, description, value, footprint')
              .or(`value.eq.${row.value},footprint.eq.${row.footprint}`)
              .limit(1);

            if (matches && matches.length > 0) {
              return {
                ...row,
                partId: matches[0].part_id,
                partName: matches[0].description
              };
            }
            return row;
          })
        );

        setBomRows(matchedRows);
        setStep('edit');
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const updateRow = (index: number, field: keyof BOMRow, value: any) => {
    const newRows = [...bomRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setBomRows(newRows);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');

    try {
      console.log('Starting board creation...');

      // Validate all rows have required fields
      const invalidRows = bomRows.filter(row => !row.partId || !row.partName);
      if (invalidRows.length > 0) {
        setError(`${invalidRows.length} row(s) missing Part ID or Part Name`);
        setCreating(false);
        return;
      }

      console.log('Creating/updating inventory parts...');
      // Step 1: Create/update inventory parts
      const inventoryIds: { [key: string]: string } = {};

      for (const row of bomRows) {
        console.log(`Processing part: ${row.partId}`);

        // Check if part already exists
        const { data: existing, error: existingError } = await supabase
          .from('inventory')
          .select('id')
          .eq('part_id', row.partId)
          .maybeSingle();

        if (existingError) {
          console.error('Error checking existing part:', existingError);
          throw existingError;
        }

        if (existing) {
          // Part exists, store its ID
          console.log(`Part ${row.partId} already exists, using ID: ${existing.id}`);
          inventoryIds[row.partId] = existing.id;
        } else {
          // Create new inventory part
          console.log(`Creating new part: ${row.partId}`);
          const { data: newPart, error: partError } = await supabase
            .from('inventory')
            .insert({
              part_id: row.partId,
              description: row.partName,
              value: row.value || null,
              footprint: row.footprint || null,
              bin_id: row.binId || null,
              location_within_bin: row.locationWithinBin || null,
              quantity: 0, // Start with 0, will be added via restock
              min_quantity: row.minQuantity,
              part_link: row.partLink || null,
              qr_code: `QR-${row.partId}`,
              is_sensitive: row.isSensitive
            })
            .select('id')
            .single();

          if (partError) {
            console.error('Error creating part:', partError);
            throw partError;
          }

          console.log(`Created part ${row.partId} with ID: ${newPart.id}`);
          inventoryIds[row.partId] = newPart.id;
        }
      }

      console.log('Creating board...');
      // Step 2: Create board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: boardName,
          description: boardDescription || null,
          version: boardVersion,
          created_by: userId
        })
        .select('id')
        .single();

      if (boardError) {
        console.error('Error creating board:', boardError);
        throw boardError;
      }

      console.log(`Created board with ID: ${board.id}`);

      // Step 3: Create board_parts links
      console.log('Creating board_parts links...');
      const boardPartsData = bomRows.map(row => ({
        board_id: board.id,
        part_id: inventoryIds[row.partId],
        quantity_required: row.quantity,
        notes: `Refs: ${row.references}`
      }));

      const { error: partsError } = await supabase
        .from('board_parts')
        .insert(boardPartsData);

      if (partsError) {
        console.error('Error creating board_parts:', partsError);
        throw partsError;
      }

      console.log('Board created successfully!');
      // Success!
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Create board error:', err);
      setError(err.message || 'Failed to create board');
      setCreating(false);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setBoardName('');
    setBoardVersion('1.0');
    setBoardDescription('');
    setBomRows([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Board from BOM</DialogTitle>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="board-name">Board Name *</Label>
              <Input
                id="board-name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g., ADCS Board"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="board-version">Version</Label>
                <Input
                  id="board-version"
                  value={boardVersion}
                  onChange={(e) => setBoardVersion(e.target.value)}
                  placeholder="1.0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="board-desc">Description (optional)</Label>
                <Input
                  id="board-desc"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="Board description"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Upload BOM CSV</h3>
              <p className="text-xs text-gray-600 mb-4">
                CSV must have columns: References, Value, Footprint, Quantity
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Board: {boardName} v{boardVersion}</h3>
                <p className="text-xs text-gray-600">{bomRows.length} parts in BOM</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('upload')}
              >
                Back to Upload
              </Button>
            </div>

            <div className="border rounded overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Refs</th>
                    <th className="px-2 py-2 text-left">Value</th>
                    <th className="px-2 py-2 text-left">Footprint</th>
                    <th className="px-2 py-2 text-left">Qty</th>
                    <th className="px-2 py-2 text-left">Part ID *</th>
                    <th className="px-2 py-2 text-left">Part Name *</th>
                    <th className="px-2 py-2 text-left">Bin</th>
                    <th className="px-2 py-2 text-left">Location</th>
                    <th className="px-2 py-2 text-left">Min Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {bomRows.map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-2 text-gray-600">{row.references}</td>
                      <td className="px-2 py-2 text-gray-600">{row.value}</td>
                      <td className="px-2 py-2 text-gray-600 truncate max-w-[150px]" title={row.footprint}>{row.footprint}</td>
                      <td className="px-2 py-2 text-gray-600">{row.quantity}</td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.partId}
                          onChange={(e) => updateRow(index, 'partId', e.target.value)}
                          className="h-7 text-xs font-mono"
                          required
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.partName}
                          onChange={(e) => updateRow(index, 'partName', e.target.value)}
                          className="h-7 text-xs"
                          required
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.binId}
                          onChange={(e) => updateRow(index, 'binId', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="A1"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.locationWithinBin}
                          onChange={(e) => updateRow(index, 'locationWithinBin', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Slot 1"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={row.minQuantity}
                          onChange={(e) => updateRow(index, 'minQuantity', parseInt(e.target.value))}
                          className="h-7 text-xs w-16"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'edit' && (
            <Button
              onClick={handleCreate}
              disabled={creating || !boardName || bomRows.length === 0}
            >
              {creating ? 'Creating...' : `Create Board with ${bomRows.length} Parts`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
