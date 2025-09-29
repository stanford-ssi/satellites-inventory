'use client';

import { History, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useState } from 'react';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data fetching
  const transactions = [
    {
      id: 1,
      type: 'check_out',
      part_id: 'SAT-001',
      description: 'Reaction Wheel Assembly',
      quantity: 2,
      user: 'john.doe@company.com',
      timestamp: '2024-01-15T10:30:00Z',
      notes: 'For CubeSat-Alpha mission'
    },
    {
      id: 2,
      type: 'check_in',
      part_id: 'SAT-002',
      description: 'Solar Panel Kit',
      quantity: 1,
      user: 'jane.smith@company.com',
      timestamp: '2024-01-14T14:20:00Z',
      notes: 'Returned after testing'
    }
  ];

  const filteredTransactions = transactions.filter(transaction =>
    transaction.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.user.toLowerCase().includes(searchTerm.toLowerCase())
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
        <table className="github-table">
          <thead>
            <tr>
              <th style={{width: '80px'}}>Type</th>
              <th style={{width: '140px'}}>Part ID</th>
              <th style={{minWidth: '300px'}}>Description</th>
              <th style={{width: '60px'}} className="text-right">Qty</th>
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
                    {transaction.type === 'check_out' ? (
                      <>
                        <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                        <span className="clean-badge clean-badge-checkout">Out</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                        <span className="clean-badge clean-badge-checkin">In</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="font-mono font-medium">
                  {transaction.part_id}
                </td>
                <td>
                  <div className="font-medium">{transaction.description}</div>
                </td>
                <td className="text-right font-mono">
                  {transaction.quantity}
                </td>
                <td className="text-sm">
                  {transaction.user}
                </td>
                <td className="text-sm">
                  {new Date(transaction.timestamp).toLocaleDateString()} {new Date(transaction.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="text-sm text-gray-600">
                  {transaction.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No transaction history available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}