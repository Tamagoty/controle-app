// src/components/ClientPaymentForm/ClientPaymentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './ClientPaymentForm.module.css';

const ClientPaymentForm = ({ client, onSuccess }) => {
  const [amount, setAmount] = useState(client.balance > 0 ? client.balance.toFixed(2) : '0.00');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > client.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      // Chama a função inteligente no Supabase para abater a dívida
      const { error } = await supabase.rpc('pay_client_debt', {
        p_client_id: client.client_id,
        p_payment_amount: paymentAmount
      });

      if (error) throw error;
      
      notify.success('Recebimento registado com sucesso!');
      if (onSuccess) onSuccess();

    } catch (error) {
      notify.error(error.message || 'Falha ao registar o recebimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.summary}>
        <p>Cliente: <strong>{client.client_name}</strong></p>
        <p>Dívida Total: <strong>R$ {client.total_due.toFixed(2)}</strong></p>
        <p>Saldo Devedor: <strong className={styles.balance}>R$ {client.balance.toFixed(2)}</strong></p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="amount">Valor Recebido</label>
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
        <Button type="submit" disabled={loading || client.balance <= 0}>
          {loading ? 'A Registar...' : 'Registar Recebimento'}
        </Button>
      </div>
    </form>
  );
};

export default ClientPaymentForm;
