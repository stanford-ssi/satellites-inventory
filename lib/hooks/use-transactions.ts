'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  inventory?: {
    part_id: string;
    description: string;
  };
  users?: {
    name: string;
    email: string;
  };
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          inventory(part_id, description),
          users(name, email)
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        setError(error.message);
        return;
      }

      setTransactions(data || []);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (transaction: Database['public']['Tables']['transactions']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select(`
          *,
          inventory(part_id, description),
          users(name, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      setTransactions(prev => [data, ...prev.slice(0, 49)]);
      return data;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
  };
}