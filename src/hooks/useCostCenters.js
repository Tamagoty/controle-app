// src/hooks/useCostCenters.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de Centros de Custo.
 * @returns {{costCenters: Array, loading: boolean, error: string|null, fetchCostCenters: () => Promise<void>}}
 */
export const useCostCenters = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notify = useNotify();

  const fetchCostCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_cost_centers');
      
      if (rpcError) throw rpcError;

      setCostCenters(data || []);
    } catch (err) {
      setError(err.message);
      notify.error(err.message || 'Não foi possível carregar os centros de custo.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  return { costCenters, loading, error, fetchCostCenters };
};
