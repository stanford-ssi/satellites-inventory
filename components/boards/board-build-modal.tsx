'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Hammer, AlertTriangle, Package, Wrench, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface BoardPart {
  id: string;
  part_id: string;
  quantity_required: number;
  notes: string | null;
  inventory: {
    part_id: string;
    description: string;
    quantity: number;
  };
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  version: string;
  board_parts: BoardPart[];
}

interface BoardBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  onSuccess?: () => void;
  userName?: string;
  isAdmin?: boolean;
}

export function BoardBuildModal({ isOpen, onClose, board, onSuccess, userName, isAdmin }: BoardBuildModalProps) {
  const [checkedParts, setCheckedParts] = useState<Set<string>>(new Set());
  const [building, setBuilding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!board) return null;

  const togglePart = (partId: string) => {
    const newChecked = new Set(checkedParts);
    if (newChecked.has(partId)) {
      newChecked.delete(partId);
    } else {
      newChecked.add(partId);
    }
    setCheckedParts(newChecked);
  };

  const allPartsChecked = board.board_parts.every(bp => checkedParts.has(bp.id));
  const canBuild = board.board_parts.every(bp => bp.inventory.quantity >= bp.quantity_required);
  const missingParts = board.board_parts.filter(bp => bp.inventory.quantity < bp.quantity_required);

  const handleBuild = async () => {
    if (!allPartsChecked || !canBuild) return;

    setBuilding(true);
    setError('');

    try {
      const { data, error: buildError } = await supabase.rpc('build_board', {
        board_id_param: board.id,
        quantity_param: 1,
        notes_param: `Built via dashboard by ${userName || 'Unknown'}`
      });

      if (buildError) throw buildError;

      if (data?.success) {
        // Reset state
        setCheckedParts(new Set());
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data?.error || 'Build failed');
      }
    } catch (err: any) {
      console.error('Build error:', err);
      setError(err.message || 'Failed to build board');
    } finally {
      setBuilding(false);
    }
  };

  const handleClose = () => {
    setCheckedParts(new Set());
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    if (!board || !isAdmin) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${board.name} v${board.version}"?\n\nThis will also delete all BOM entries. This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      const { data, error: deleteError } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id)
        .select();

      if (deleteError) throw deleteError;

      if (!data || data.length === 0) {
        throw new Error('Board not deleted - check RLS policies or admin permissions');
      }

      // Success
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete board');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Build: {board.name} v{board.version}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {board.description && (
            <p className="text-sm text-gray-600">{board.description}</p>
          )}

          {/* Warning if missing parts */}
          {missingParts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">Cannot Build - Missing Parts</span>
              </div>
              <div className="text-xs text-red-700">
                {missingParts.map(mp => (
                  <div key={mp.id}>
                    {mp.inventory.part_id}: Need {mp.quantity_required}, have {mp.inventory.quantity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOM Checklist */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Bill of Materials - Check off each part as you use it
            </h3>
            <div className="space-y-2 border border-gray-200 rounded p-3">
              {board.board_parts.map((bp) => {
                const isChecked = checkedParts.has(bp.id);
                const hasEnough = bp.inventory.quantity >= bp.quantity_required;

                return (
                  <div
                    key={bp.id}
                    className={`flex items-start gap-3 p-2 rounded transition-colors ${
                      isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => togglePart(bp.id)}
                      disabled={!hasEnough}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{bp.inventory.part_id}</span>
                        {!hasEnough && (
                          <span className="text-xs text-red-600 font-medium">Insufficient stock</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">{bp.inventory.description}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">Need: {bp.quantity_required}</div>
                      <div className={hasEnough ? 'text-green-600' : 'text-red-600'}>
                        Have: {bp.inventory.quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-xs text-gray-600">
            {checkedParts.size} of {board.board_parts.length} parts checked
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || building}
                className="h-8 text-xs"
              >
                {deleting ? (
                  <>Deleting...</>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete Board
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleBuild}
              disabled={!allPartsChecked || !canBuild || building}
              className={`h-8 text-xs ${(!allPartsChecked || !canBuild) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {building ? (
                <>Building...</>
              ) : (
                <>
                  <Hammer className="h-3 w-3 mr-2" />
                  {!allPartsChecked
                    ? `Check all parts (${checkedParts.size}/${board.board_parts.length})`
                    : 'Board Built'
                  }
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
