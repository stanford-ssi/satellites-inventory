'use client';

import { AlertCircle, Search, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface OutstandingItem {
  part_id: string;
  description: string;
  user_name: string;
  user_email: string;
  total_checked_out: number;
  last_checkout_date: string;
  checkout_notes: string[];
}

export default function OutstandingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutstandingItems();
  }, []);

  const fetchOutstandingItems = async () => {
    try {
      // Fetch all transactions and calculate net outstanding per user per part
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          quantity,
          notes,
          timestamp,
          inventory:part_id (
            part_id,
            description
          ),
          users:user_id (
            name,
            email
          )
        `)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
        return;
      }

      // Calculate outstanding items per user per part
      const outstandingMap = new Map<string, OutstandingItem>();

      transactions?.forEach((transaction: any) => {
        const key = `${transaction.inventory?.part_id}-${transaction.users?.email}`;

        if (!outstandingMap.has(key)) {
          outstandingMap.set(key, {
            part_id: transaction.inventory?.part_id || 'N/A',
            description: transaction.inventory?.description || 'N/A',
            user_name: transaction.users?.name || 'Unknown',
            user_email: transaction.users?.email || 'Unknown',
            total_checked_out: 0,
            last_checkout_date: transaction.timestamp,
            checkout_notes: []
          });
        }

        const item = outstandingMap.get(key)!;

        // Calculate net quantity
        if (transaction.type === 'checkout') {
          item.total_checked_out += transaction.quantity;
          item.last_checkout_date = transaction.timestamp;
          if (transaction.notes) {
            item.checkout_notes.push(transaction.notes);
          }
        } else if (transaction.type === 'return') {
          item.total_checked_out -= transaction.quantity;
        }
      });

      // Filter out items that have been fully returned (net = 0)
      const outstanding = Array.from(outstandingMap.values())
        .filter(item => item.total_checked_out > 0);

      setOutstandingItems(outstanding);
    } catch (error) {
      console.error('Error fetching outstanding items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = outstandingItems.filter(item =>
    item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>Outstanding Items</h1>
            <p>{filteredItems.length} items not returned</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="search-container">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Search outstanding items..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="clean-card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading outstanding items...</p>
          </div>
        ) : (
          <>
            <table className="github-table">
              <thead>
                <tr>
                  <th style={{width: '140px'}}>Part ID</th>
                  <th style={{minWidth: '300px'}}>Description</th>
                  <th style={{width: '200px'}}>User</th>
                  <th style={{width: '80px'}} className="text-right">Qty Out</th>
                  <th style={{width: '150px'}}>Last Checkout</th>
                  <th style={{minWidth: '200px'}}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={`${item.part_id}-${item.user_email}-${index}`}>
                    <td className="font-mono font-medium">
                      {item.part_id}
                    </td>
                    <td>
                      <div className="font-medium">{item.description}</div>
                    </td>
                    <td className="text-sm">
                      <div className="font-medium">{item.user_name}</div>
                      <div className="text-gray-500 text-xs">{item.user_email}</div>
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-mono font-medium">
                        <AlertCircle className="h-3 w-3" />
                        {item.total_checked_out}
                      </span>
                    </td>
                    <td className="text-sm">
                      {new Date(item.last_checkout_date).toLocaleDateString()}
                    </td>
                    <td className="text-sm text-gray-600">
                      {item.checkout_notes.length > 0 ? item.checkout_notes.join('; ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'No matching outstanding items' : 'All clear!'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No items are currently checked out'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}