// src/components/CommissionPaymentForm/CommissionPaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './CommissionPaymentForm.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const CommissionPaymentForm = ({ seller, onSuccess }) => {
  const [amount, setAmount] = useState(seller.balance > 0 ? seller.balance.toFixed(2) : '0.00');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const notify = useNotify();

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_commission_payments_for_seller', { 
          p_seller_id: seller.seller_id 
        });
        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        notify.error("Não foi possível carregar o histórico de pagamentos.");
      } finally {
        setListLoading(false);
      }
    };
    if (seller.seller_id) fetchPayments();
  }, [seller.seller_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > seller.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('pay_seller_commission', {
        p_seller_id: seller.seller_id,
        p_payment_amount: paymentAmount
      });

      if (error) throw error;
      
      notify.success('Pagamento de comissão registado com sucesso!');
      if (onSuccess) onSuccess();

    } catch (error) {
      notify.error(error.message || 'Falha ao registar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Tem a certeza que quer apagar este pagamento?')) {
      try {
        const { error } = await supabase.from('commission_payments').delete().eq('id', paymentId);
        if (error) throw error;
        notify.success('Pagamento apagado!');
        if (onSuccess) onSuccess();
      } catch (error) {
        notify.error(error.message || 'Falha ao apagar o pagamento.');
      }
    }
  };

  const handleUpdate = async () => {
    const newAmount = parseFloat(editingAmount);
    const paymentToEdit = payments.find(p => p.id === editingPaymentId);

    if (!newAmount || newAmount <= 0) {
      notify.error('O valor do pagamento editado não pode ser zero ou negativo.');
      return;
    }

    const newTotalPaid = (seller.total_commission_paid - paymentToEdit.amount_paid) + newAmount;
    if (newTotalPaid > seller.total_commission_due + 0.01) {
        notify.error(`O valor editado excede o total da comissão devida (R$ ${seller.total_commission_due.toFixed(2)}).`);
        return;
    }

    try {
      const { error } = await supabase
        .from('commission_payments')
        .update({ amount_paid: newAmount })
        .eq('id', editingPaymentId);
      if (error) throw error;
      notify.success('Pagamento atualizado!');
      setEditingPaymentId(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao atualizar o pagamento.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.formSection}>
        <div className={styles.summary}>
          <p>Vendedor: <strong>{seller.seller_name}</strong></p>
          <p>Comissão Devida (Total): <strong>R$ {seller.total_commission_due.toFixed(2)}</strong></p>
          <p>Saldo de Comissão: <strong className={styles.balance}>R$ {seller.balance.toFixed(2)}</strong></p>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor a Pagar</label>
          <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className={styles.input}/>
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={loading || seller.balance <= 0}>Registar Pagamento</Button>
        </div>
      </form>

      <div className={styles.paymentsList}>
        <h4>Histórico de Pagamentos</h4>
        {listLoading ? <p>A carregar...</p> : payments.length > 0 ? (
          <ul>
            {payments.map(p => (
              <li key={p.id} className={editingPaymentId === p.id ? styles.editingItem : ''}>
                {editingPaymentId === p.id ? (
                  <>
                    <input type="number" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} className={styles.editInput} autoFocus/>
                    <div className={styles.paymentActions}>
                      <Button icon={FaCheck} variant="success" isIconOnly onClick={handleUpdate}>Guardar</Button>
                      <Button icon={FaTimes} variant="ghost" isIconOnly onClick={() => setEditingPaymentId(null)}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.paymentInfo}>
                      <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                      <span className={styles.paymentAmount}>R$ {p.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className={styles.paymentActions}>
                      <Button icon={FaEdit} isIconOnly onClick={() => { setEditingPaymentId(p.id); setEditingAmount(p.amount_paid.toFixed(2)); }}>Editar</Button>
                      <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDelete(p.id)}>Apagar</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : <p className={styles.noPayments}>Nenhum pagamento registado.</p>}
      </div>
    </div>
  );
};

export default CommissionPaymentForm;
