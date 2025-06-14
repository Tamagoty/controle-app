// src/components/ExpensePaymentForm/ExpensePaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './ExpensePaymentForm.module.css';

const ExpensePaymentForm = ({ expense, onSuccess }) => {
  const [amount, setAmount] = useState(expense.balance > 0 ? expense.balance.toFixed(2) : '0.00');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase.from('expense_payments').select('*').eq('expense_id', expense.id);
        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        notify.error("Não foi possível carregar os pagamentos.");
      } finally {
        setListLoading(false);
      }
    };
    if (expense.id) fetchPayments();
  }, [expense.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > expense.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('expense_payments').insert({
        expense_id: expense.id,
        amount_paid: paymentAmount,
      });
      if (error) throw error;
      notify.success('Pagamento registado!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao registar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.formSection}>
        <div className={styles.summary}>
          <p>Despesa: <strong>{expense.description}</strong></p>
          <p>Valor Total: <strong>R$ {expense.amount.toFixed(2)}</strong></p>
          <p>Saldo a Pagar: <strong className={styles.balance}>R$ {expense.balance.toFixed(2)}</strong></p>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor a Pagar</label>
          <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className={styles.input} />
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={loading || expense.balance <= 0}>
            Registar Pagamento
          </Button>
        </div>
      </form>

       <div className={styles.paymentsList}>
        <h4>Histórico de Pagamentos</h4>
        {listLoading ? <p>A carregar...</p> : payments.length > 0 ? (
          <ul>
            {payments.map(p => (
              <li key={p.id}>
                <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                <span>R$ {p.amount_paid.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum pagamento registado.</p>
        )}
      </div>
    </div>
  );
};

export default ExpensePaymentForm;
