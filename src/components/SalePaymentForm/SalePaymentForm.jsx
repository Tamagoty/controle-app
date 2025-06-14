// src/components/SalePaymentForm/SalePaymentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './SalePaymentForm.module.css';

/**
 * Formulário para registar um pagamento de uma venda.
 * @param {object} props
 * @param {object} props.sale - O objeto da venda para a qual o pagamento está a ser registado.
 * @param {() => void} props.onSuccess - Função chamada após o registo bem-sucedido.
 */
const SalePaymentForm = ({ sale, onSuccess }) => {
  const [amount, setAmount] = useState(sale.balance.toFixed(2));
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0 || paymentAmount > sale.balance) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('sale_payments').insert({
        sale_id: sale.id,
        amount_paid: paymentAmount,
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
        <p>Cliente: <strong>{sale.client_name}</strong></p>
        <p>Valor Total: <strong>R$ {sale.total_amount.toFixed(2)}</strong></p>
        <p>Saldo Devedor: <strong className={styles.balance}>R$ {sale.balance.toFixed(2)}</strong></p>
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
        <Button type="submit" disabled={loading}>
          {loading ? 'A Registar...' : 'Registar Pagamento'}
        </Button>
      </div>
    </form>
  );
};

export default SalePaymentForm;
