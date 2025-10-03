'use client';

import { History, Search, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  type: 'checkout' | 'return' | 'adjustment';
  quantity: number;
  notes: string | null;
  timestamp: string;
  inventory: {
    part_id: string;
    description: string;
  };
  users: {
    name: string;
    email: string;
  };
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
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
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data as any);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.inventory?.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.inventory?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.users?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="minimal-layout">
      <div className="minimal-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>Transaction History</h1>
            <p>{filteredTransactions.length} transactions</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="search-container">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
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
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : (
          <>
            <table className="github-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>Type</th>
                  <th style={{width: '140px'}}>Part ID</th>
                  <th style={{minWidth: '300px'}}>Description</th>
                  <th style={{width: '60px'}} className="text-center">Qty</th>
                  <th style={{width: '200px'}}>User</th>
                  <th style={{width: '150px'}}>Date</th>
                  <th style={{minWidth: '200px'}}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'checkout' ? (
                          <>
                            <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                            <span className="clean-badge clean-badge-checkout">Out</span>
                          </>
                        ) : transaction.type === 'return' ? (
                          <>
                            <ArrowDownCircle className="h-4 w-4 text-green-500" />
                            <span className="clean-badge clean-badge-checkin">In</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 text-blue-500" />
                            <span className="clean-badge clean-badge-checkin">Add</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="font-semibold">
                      {transaction.inventory?.part_id || 'N/A'}
                    </td>
                    <td>
                      <div>{transaction.inventory?.description || 'N/A'}</div>
                    </td>
                    <td className="text-center">
                      {transaction.quantity}
                    </td>
                    <td className="text-xs text-gray-500">
                      {transaction.users?.email || transaction.users?.name || 'Unknown'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleDateString()} {new Date(transaction.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="text-sm text-gray-600">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && !loading && (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No transaction history available'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}