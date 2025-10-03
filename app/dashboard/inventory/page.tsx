'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Package, ExternalLink, QrCode, CreditCard as Edit, TriangleAlert as AlertTriangle, Loader2, FileDown } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useInventory } from '@/lib/hooks/use-inventory';
import { QrCodeModal } from '@/components/inventory/qr-code-modal';
import { AddPartModal } from '@/components/inventory/add-part-modal';
import { useState } from 'react';
import { generateBulkQrPdf } from '@/lib/utils/bulk-qr-pdf';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [addPartModalOpen, setAddPartModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ partId: string; description: string } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfColumns, setPdfColumns] = useState(3);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const { inventory, loading, error, refetch } = useInventory();

  const handleShowQrCode = (partId: string, description: string) => {
    setSelectedItem({ partId, description });
    setQrModalOpen(true);
  };

  const handleOpenColumnModal = () => {
    setColumnModalOpen(true);
  };

  const handleGenerateBulkQrPdf = async () => {
    try {
      setColumnModalOpen(false);
      setGeneratingPdf(true);
      const partsForPdf = visibleInventory.map(item => ({
        part_id: item.part_id,
        description: item.description
      }));

      await generateBulkQrPdf(partsForPdf, `qr-codes-${new Date().toISOString().split('T')[0]}.pdf`, pdfColumns);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const visibleInventory = inventory.filter(item =>
    (item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockCount = visibleInventory.filter(item => item.quantity <= item.min_quantity).length;

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error loading inventory</h3>
            <p className="text-muted-foreground">{error}</p>
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
            <h1>Inventory</h1>
            <p>
              {visibleInventory.length} parts
              {lowStockCount > 0 && (
                <span className="ml-2 text-orange-600">
                  • {lowStockCount} items low stock
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="search-container">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder=""
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="github-button github-button-sm"
              onClick={handleOpenColumnModal}
              disabled={generatingPdf || visibleInventory.length === 0}
            >
              {generatingPdf ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <FileDown className="h-3 w-3 mr-1" />
              )}
              {generatingPdf ? 'Generating...' : 'Print QR Codes'}
            </button>
            {isAdmin && (
              <>
                <button
                  className="github-button github-button-primary github-button-sm"
                  onClick={() => setAddPartModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Part
                </button>
                <button
                  className="github-button github-button-primary github-button-sm"
                  onClick={() => router.push('/dashboard/restock')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Restock
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="clean-card">
        <table className="github-table">
          <thead>
            <tr>
              <th style={{width: '140px'}}>Part ID</th>
              <th style={{minWidth: '300px'}}>Name</th>
              <th style={{width: '120px'}}>Location</th>
              <th style={{width: '60px'}} className="text-center">Qty</th>
              <th style={{width: '60px'}} className="text-center">Min</th>
              <th style={{width: '120px'}}>Status</th>
              <th style={{width: '80px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleInventory.map((item) => (
              <tr key={item.id}>
                <td className="font-semibold">
                  {item.part_id}
                </td>
                <td>
                  <div>
                    <div>{item.description}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Updated: {new Date(item.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td>
                  {item.is_sensitive && !isAdmin ? (
                    <span className="clean-badge clean-badge-restricted">RESTRICTED</span>
                  ) : (
                    <div>
                      <div>{item.bin_id}</div>
                      <div className="text-xs text-gray-500">{item.location_within_bin}</div>
                    </div>
                  )}
                </td>
                <td className="text-center">
                  {item.quantity}
                </td>
                <td className="text-center">
                  {item.min_quantity}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {item.quantity === 0 ? (
                      <span className="clean-badge clean-badge-checkout">
                        <span className="status-dot status-dot-red"></span>
                        Out of Stock
                      </span>
                    ) : item.quantity <= item.min_quantity ? (
                      <span className="clean-badge clean-badge-lowstock">
                        <span className="status-dot status-dot-yellow"></span>
                        Low Stock
                      </span>
                    ) : (
                      <span className="clean-badge clean-badge-active">
                        <span className="status-dot status-dot-green"></span>
                        In Stock
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      className="github-button github-button-sm"
                      onClick={() => handleShowQrCode(item.part_id, item.description)}
                      title="Show QR Code"
                    >
                      <QrCode className="h-3 w-3" />
                    </button>
                    {item.part_link && (
                      <a href={item.part_link} target="_blank" rel="noopener noreferrer" className="github-button github-button-sm">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No parts found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No inventory items available'}
            </p>
          </div>
        )}
      </div>

      {/* Column Selection Modal */}
      <Dialog open={columnModalOpen} onOpenChange={setColumnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print QR Codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                How many columns per page?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((col) => (
                  <button
                    key={col}
                    onClick={() => setPdfColumns(col)}
                    className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-all ${
                      pdfColumns === col
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Generating {visibleInventory.length} QR code{visibleInventory.length !== 1 ? 's' : ''} with {pdfColumns} column{pdfColumns !== 1 ? 's' : ''} per page
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setColumnModalOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateBulkQrPdf}
              disabled={generatingPdf}
              className="text-xs h-8"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-3 w-3 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      {selectedItem && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          partId={selectedItem.partId}
          description={selectedItem.description}
        />
      )}

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={addPartModalOpen}
        onClose={() => setAddPartModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}