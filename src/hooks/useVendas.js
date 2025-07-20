// src/hooks/useVendas.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de vendas.
 * Encapsula o estado, o carregamento, os erros e a própria função de busca.
 * @returns {{vendas: Array, loading: boolean, error: string|null, fetchVendas: () => Promise<void>}}
 */
export const useVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notify = useNotify();

  const fetchVendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_sales_with_payment_status');
      
      if (rpcError) throw rpcError;

      setVendas(data || []);
    } catch (err) {
      setError(err.message);
      notify.error(err.message || 'Não foi possível carregar as vendas.');
    } finally {
      setLoading(false);
    }
  }, [notify]); // notify é estável, não causará loop.

  // Busca os dados na primeira vez que o hook é utilizado.
  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  return { vendas, loading, error, fetchVendas };
};
