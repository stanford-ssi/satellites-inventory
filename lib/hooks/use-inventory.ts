'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('part_id');

      if (error) {
        setError(error.message);
        return;
      }

      setInventory(data || []);
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const addItem = async (item: Database['public']['Tables']['inventory']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setInventory(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Database['public']['Tables']['inventory']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setInventory(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  return {
    inventory,
    loading,
    error,
    refetch: fetchInventory,
    addItem,
    updateItem,
    deleteItem,
  };
}