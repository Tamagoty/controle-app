// src/hooks/useVendas.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de vendas.
 * Agora aceita filtros para otimizar a busca no lado do servidor.
 * @returns {{vendas: Array, loading: boolean, fetchVendas: (filters: object) => Promise<void>}}
 */
export const useVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchVendas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      
      const { 
        clientName = null, 
        costCenterName = null, 
        paymentStatus = null 
      } = filters;

      const { data, error: rpcError } = await supabase.rpc('get_sales_with_payment_status', {
        p_client_name_filter: clientName || null,
        p_cost_center_name_filter: costCenterName || null,
        p_payment_status_filter: paymentStatus || null
      });
      
      if (rpcError) throw rpcError;

      setVendas(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar as vendas.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Busca os dados sem filtros na primeira vez que o hook é utilizado.
  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  return { vendas, loading, fetchVendas };
};
