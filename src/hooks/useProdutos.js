// src/hooks/useProdutos.js

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotify } from './useNotify';

/**
 * Hook personalizado para gerir a lógica de busca de dados de produtos.
 * @returns {{products: Array, categories: Array, loading: boolean, fetchProducts: () => Promise<void>}}
 */
export const useProdutos = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc("get_products_with_details");
      if (rpcError) throw rpcError;
      setProducts(data || []);
    } catch (err) {
      notify.error(err.message || "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchCategories = useCallback(async () => {
    try {
        const { data, error: catError } = await supabase.from('product_categories').select('id, name');
        if (catError) throw catError;
        setCategories(data || []);
    } catch (err) {
        notify.error(err.message || "Não foi possível carregar as categorias de produtos.");
    }
  }, [notify]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return { products, categories, loading, fetchProducts };
};
