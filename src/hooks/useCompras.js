// src/hooks/useCompras.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de compras.
 * @returns {{compras: Array, loading: boolean, fetchCompras: () => Promise<void>}}
 */
export const useCompras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchCompras = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_purchases_with_payment_status');
      
      if (rpcError) throw rpcError;

      setCompras(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar as compras.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Busca os dados na primeira vez que o hook é utilizado.
  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

  return { compras, loading, fetchCompras };
};
