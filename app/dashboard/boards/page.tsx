'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Hammer, Search, Plus, Package, Wrench, AlertTriangle, Clock, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Board {
  id: string;
  name: string;
  description: string | null;
  version: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface BoardWithParts extends Board {
  board_parts: {
    id: string;
    part_id: string;
    quantity_required: number;
    notes: string | null;
    inventory: {
      part_id: string;
      description: string;
      quantity: number;
    };
  }[];
  builds_count?: number;
}

export default function BoardsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [boards, setBoards] = useState<BoardWithParts[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingBoard, setBuildingBoard] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          board_parts (
            id,
            part_id,
            quantity_required,
            notes,
            inventory (
              part_id,
              description,
              quantity
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get build counts for each board
      const boardsWithCounts = await Promise.all(
        (data || []).map(async (board) => {
          const { count } = await supabase
            .from('board_builds')
            .select('*', { count: 'exact', head: true })
            .eq('board_id', board.id);

          return {
            ...board,
            builds_count: count || 0
          };
        })
      );

      setBoards(boardsWithCounts);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuildBoard = async (boardId: string, quantity: number = 1) => {
    setBuildingBoard(boardId);
    try {
      const { data, error } = await supabase.rpc('build_board', {
        board_id_param: boardId,
        quantity_param: quantity,
        notes_param: `Built via dashboard by ${profile?.name}`
      });

      if (error) throw error;

      if (data?.success) {
        alert(`Board built successfully! Build ID: ${data.build_id}`);
        // Refresh boards to update inventory counts
        fetchBoards();
      } else {
        alert(`Build failed: ${data?.error}\n\nInsufficient parts: ${data?.insufficient_parts?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error building board:', error);
      alert('Error building board. Please try again.');
    } finally {
      setBuildingBoard(null);
    }
  };

  const canBuildBoard = (board: BoardWithParts) => {
    return board.board_parts.every(bp =>
      bp.inventory.quantity >= bp.quantity_required
    );
  };

  if (loading) {
    return (
      <div className="minimal-layout">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading boards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>Board Manufacturing</h1>
            <p>{filteredBoards.length} board designs • {filteredBoards.filter(b => canBuildBoard(b)).length} ready to build</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="search-container">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Search boards..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button className="github-button github-button-primary github-button-sm">
                <Plus className="h-4 w-4 mr-1" />
                New Board
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredBoards.map((board) => {
          const canBuild = canBuildBoard(board);
          const missingParts = board.board_parts.filter(bp => bp.inventory.quantity < bp.quantity_required);

          return (
            <div key={board.id} className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <div className="dashboard-card-title">{board.name}</div>
                  <Badge variant="outline" className="text-xs">
                    v{board.version}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {canBuild ? (
                    <span className="clean-badge clean-badge-active">Ready</span>
                  ) : (
                    <span className="clean-badge clean-badge-lowstock">Missing Parts</span>
                  )}
                  <button
                    className={`github-button github-button-sm ${canBuild ? 'github-button-primary' : ''}`}
                    onClick={() => handleBuildBoard(board.id)}
                    disabled={!canBuild || buildingBoard === board.id}
                  >
                    <Hammer className="h-3 w-3 mr-1" />
                    {buildingBoard === board.id ? 'Building...' : 'Build Board'}
                  </button>
                </div>
              </div>

              {board.description && (
                <div className="dashboard-card-description mb-3">{board.description}</div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {/* BOM (Bill of Materials) */}
                <div>
                  <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">
                    Bill of Materials ({board.board_parts.length} parts)
                  </h4>
                  <div className="space-y-2">
                    {board.board_parts.map((bp) => (
                      <div key={bp.id} className="flex items-center justify-between text-xs p-2 border border-gray-200 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{bp.inventory.part_id}</div>
                          <div className="text-gray-500">{bp.inventory.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Need: {bp.quantity_required}</div>
                          <div className={`text-xs ${bp.inventory.quantity >= bp.quantity_required ? 'text-green-600' : 'text-red-600'}`}>
                            Have: {bp.inventory.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Board Info & Status */}
                <div>
                  <h4 className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">
                    Board Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Total Builds:</span>
                      <span className="font-medium">{board.builds_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Created:</span>
                      <span>{new Date(board.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Last Updated:</span>
                      <span>{new Date(board.updated_at).toLocaleDateString()}</span>
                    </div>

                    {missingParts.length > 0 && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          <span className="text-xs font-medium text-orange-800">Missing Parts:</span>
                        </div>
                        <div className="text-xs text-orange-700">
                          {missingParts.map(mp => mp.inventory.part_id).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBoards.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No boards found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No board designs available'}
          </p>
        </div>
      )}

      {/* Board Statistics */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Boards</div>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{boards.length}</div>
          <div className="stat-card-description">Active designs</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Ready to Build</div>
            <Wrench className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{boards.filter(b => canBuildBoard(b)).length}</div>
          <div className="stat-card-description">All parts available</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Builds</div>
            <Hammer className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{boards.reduce((sum, b) => sum + (b.builds_count || 0), 0)}</div>
          <div className="stat-card-description">Boards manufactured</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Missing Parts</div>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="stat-card-value">{boards.filter(b => !canBuildBoard(b)).length}</div>
          <div className="stat-card-description">Need restocking</div>
        </div>
      </div>
    </div>
  );
}