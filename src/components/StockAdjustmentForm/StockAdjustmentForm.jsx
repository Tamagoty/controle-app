// src/components/StockAdjustmentForm/StockAdjustmentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './StockAdjustmentForm.module.css';
import Button from '../Button/Button';

const StockAdjustmentForm = ({ product, onSuccess }) => {
  const [adjustment, setAdjustment] = useState(0);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const adjustmentQuantity = parseInt(adjustment, 10);
    if (!adjustmentQuantity || adjustmentQuantity === 0) {
      notify.error('Por favor, insira uma quantidade válida para o ajuste.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('adjust_stock_quantity', {
        p_product_id: product.id,
        p_adjustment_quantity: adjustmentQuantity,
      });

      if (error) throw error;
      notify.success('Stock ajustado com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao ajustar o stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.summary}>
        <p>Produto: <strong>{product.name}</strong></p>
        <p>Stock Atual: <strong>{product.stock_quantity}</strong></p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="adjustment">Quantidade de Ajuste</label>
        <input 
          id="adjustment" 
          type="number" 
          value={adjustment} 
          onChange={(e) => setAdjustment(e.target.value)} 
          className={styles.input}
          placeholder="Use valores negativos para diminuir"
        />
        <small>Use um número positivo para adicionar (produção) e um número negativo para remover (perda/uso).</small>
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'Ajustando...' : 'Ajustar Stock'}
        </Button>
      </div>
    </form>
  );
};

export default StockAdjustmentForm;
