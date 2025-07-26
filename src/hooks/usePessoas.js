// src/hooks/usePessoas.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de entidades (pessoas/empresas).
 * @returns {{entities: Array, loading: boolean, fetchEntities: () => Promise<void>}}
 */
export const usePessoas = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_entities_with_roles');
      
      if (rpcError) throw rpcError;

      setEntities(data || []);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar as pessoas e empresas.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return { entities, loading, fetchEntities };
};
