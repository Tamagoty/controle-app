// src/components/SupplierPaymentForm/SupplierPaymentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './SupplierPaymentForm.module.css';

const SupplierPaymentForm = ({ supplier, onSuccess }) => {
  const [amount, setAmount] = useState(supplier.balance > 0 ? supplier.balance.toFixed(2) : '0.00');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > supplier.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      // Chama a função inteligente no Supabase para abater a dívida
      const { error } = await supabase.rpc('pay_supplier_debt', {
        p_supplier_id: supplier.supplier_id,
        p_payment_amount: paymentAmount
      });

      if (error) throw error;
      
      notify.success('Pagamento registado com sucesso!');
      if (onSuccess) onSuccess();

    } catch (error) {
      notify.error(error.message || 'Falha ao registar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.summary}>
        <p>Fornecedor: <strong>{supplier.supplier_name}</strong></p>
        <p>Dívida Total: <strong>R$ {supplier.total_due.toFixed(2)}</strong></p>
        <p>Saldo a Pagar: <strong className={styles.balance}>R$ {supplier.balance.toFixed(2)}</strong></p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="amount">Valor a Pagar</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading || supplier.balance <= 0}>
          {loading ? 'A Registar...' : 'Registar Pagamento'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierPaymentForm;
