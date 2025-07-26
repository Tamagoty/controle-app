// src/components/CommissionPaymentForm/CommissionPaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import styles from './CommissionPaymentForm.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import CurrencyInput from '../CurrencyInput/CurrencyInput';

const CommissionPaymentForm = ({ seller, onSuccess }) => {
  const [amount, setAmount] = useState(seller.balance > 0 ? seller.balance : 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const notify = useNotify();

  const handleFocus = (event) => event.target.select();

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_commission_payments_for_seller', { 
          p_seller_id: seller.seller_id 
        });
        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        notify.error(err.message || "Não foi possível carregar o histórico de pagamentos.");
      } finally {
        setListLoading(false);
      }
    };
    if (seller.seller_id) fetchPayments();
  }, [seller.seller_id, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!amount || amount <= 0 || amount > seller.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      // CORREÇÃO: Usa os novos nomes de parâmetros para forçar a ordem correta
      const { error } = await supabase.rpc('pay_seller_commission', {
        p_seller_id: seller.seller_id,
        p_payment_amount: amount,
        p_payment_date: new Date(`${paymentDate}T12:00:00`).toISOString()
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

  const handleDelete = (paymentId) => {
    setPaymentToDelete(paymentId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const { error } = await supabase.from('commission_payments').delete().eq('id', paymentToDelete);
      if (error) throw error;
      notify.success('Pagamento apagado!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao apagar o pagamento.');
    } finally {
      setIsConfirmModalOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleEditClick = (payment) => {
    setEditingPayment({
        id: payment.id,
        amount_paid: payment.amount_paid,
        payment_date: new Date(payment.payment_date).toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => setEditingPayment(null);

  const handleUpdate = async () => {
    // ... (lógica de validação)
    try {
      const { error } = await supabase
        .from('commission_payments')
        .update({ 
            amount_paid: editingPayment.amount_paid,
            payment_date: editingPayment.payment_date
        })
        .eq('id', editingPayment.id);
      if (error) throw error;
      notify.success('Pagamento atualizado!');
      handleCancelEdit();
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
          <p>Comissão Devida (Total): <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.total_commission_due)}</strong></p>
          <p>Saldo de Comissão: <strong className={styles.balance}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.balance)}</strong></p>
        </div>
        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label htmlFor="amount">Valor a Pagar</label>
                <CurrencyInput value={amount} onChange={setAmount} onFocus={handleFocus} />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="paymentDate">Data do Pagamento</label>
                <input id="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className={styles.input}/>
            </div>
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
              <li key={p.id} className={editingPayment?.id === p.id ? styles.editingItem : ''}>
                {editingPayment?.id === p.id ? (
                  <div className={styles.editForm}>
                    <CurrencyInput value={editingPayment.amount_paid} onChange={(val) => setEditingPayment(e => ({...e, amount_paid: val}))} onFocus={handleFocus} />
                    <input type="date" value={editingPayment.payment_date} onChange={(e) => setEditingPayment(c => ({...c, payment_date: e.target.value}))} className={styles.input} />
                    <div className={styles.paymentActions}>
                      <Button icon={FaCheck} variant="success" isIconOnly onClick={handleUpdate} />
                      <Button icon={FaTimes} variant="ghost" isIconOnly onClick={handleCancelEdit} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.paymentInfo}>
                      <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                      <span className={styles.paymentAmount}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount_paid)}</span>
                    </div>
                    <div className={styles.paymentActions}>
                      <Button icon={FaEdit} isIconOnly onClick={() => handleEditClick(p)}>Editar</Button>
                      <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDelete(p.id)}>Apagar</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : <p className={styles.noPayments}>Nenhum pagamento registado.</p>}
      </div>
      
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar este pagamento de comissão?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Apagar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommissionPaymentForm;
