// src/hooks/useContasAReceber.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir o resumo de contas a receber.
 * @returns {{summary: Array, loading: boolean, error: string|null, fetchSummary: () => Promise<void>}}
 */
export const useContasAReceber = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notify = useNotify();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_accounts_receivable_summary');
      
      if (rpcError) throw rpcError;

      setSummary(data || []);
    } catch (err) {
      setError(err.message);
      notify.error(err.message || 'Não foi possível carregar o resumo de contas a receber.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, fetchSummary };
};
