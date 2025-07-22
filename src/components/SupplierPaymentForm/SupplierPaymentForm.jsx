// src/components/SupplierPaymentForm/SupplierPaymentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './SupplierPaymentForm.module.css';
import CurrencyInput from '../CurrencyInput/CurrencyInput';

const SupplierPaymentForm = ({ supplier, onSuccess }) => {
  const [amount, setAmount] = useState(supplier.balance > 0 ? supplier.balance : 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!amount || amount <= 0 || amount > supplier.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('pay_supplier_debt', {
        p_supplier_id: supplier.supplier_id,
        p_payment_amount: amount,
        p_payment_date: paymentDate
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
        <p>Dívida Total: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(supplier.total_due)}</strong></p>
        <p>Saldo a Pagar: <strong className={styles.balance}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(supplier.balance)}</strong></p>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
            <label htmlFor="amount">Valor a Pagar</label>
            <CurrencyInput value={amount} onChange={setAmount} />
        </div>
        <div className={styles.formGroup}>
            <label htmlFor="paymentDate">Data do Pagamento</label>
            <input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className={styles.input}
            />
        </div>
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
