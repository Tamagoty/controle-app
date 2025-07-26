// src/hooks/useContasAReceber.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir o resumo de contas a receber.
 * @returns {{summary: Array, loading: boolean, fetchSummary: () => Promise<void>}}
 */
export const useContasAReceber = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_accounts_receivable_summary');
      
      if (rpcError) throw rpcError;

      setSummary(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar o resumo de contas a receber.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, fetchSummary };
};
