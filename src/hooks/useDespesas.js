// src/hooks/useDespesas.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de despesas gerais.
 * @returns {{expenses: Array, loading: boolean, fetchExpenses: () => Promise<void>}}
 */
export const useDespesas = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_expenses_with_payment_status');
      
      if (rpcError) throw rpcError;

      setExpenses(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, fetchExpenses };
};
