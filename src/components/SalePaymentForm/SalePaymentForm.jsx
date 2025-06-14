// src/components/SalePaymentForm/SalePaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './SalePaymentForm.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const SalePaymentForm = ({ sale, onSuccess }) => {
  const [amount, setAmount] = useState(sale.balance > 0 ? sale.balance.toFixed(2) : '0.00');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  
  // Estados para controlar a edição
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const notify = useNotify();

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_sale_payments', { p_sale_id: sale.id });
        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        notify.error("Não foi possível carregar os pagamentos existentes.");
      } finally {
        setListLoading(false);
      }
    };

    if (sale.id) {
      fetchPayments();
    }
  }, [sale.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > sale.balance + 0.01) {
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

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Tem a certeza que quer apagar este pagamento?')) {
      try {
        const { error } = await supabase.from('sale_payments').delete().eq('id', paymentId);
        if (error) throw error;
        notify.success('Pagamento apagado com sucesso!');
        if (onSuccess) onSuccess();
      } catch (error) {
        notify.error(error.message || 'Falha ao apagar o pagamento.');
      }
    }
  };
  
  // Funções para o modo de edição
  const handleEditClick = (payment) => {
    setEditingPaymentId(payment.id);
    setEditingAmount(payment.amount_paid.toFixed(2));
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditingAmount('');
  };

  const handleUpdatePayment = async () => {
    const paymentToEdit = payments.find(p => p.id === editingPaymentId);
    const otherPaymentsTotal = sale.total_paid - paymentToEdit.amount_paid;
    const maxAllowedValue = sale.total_amount - otherPaymentsTotal;
    const newAmount = parseFloat(editingAmount);

    if (!newAmount || newAmount <= 0 || newAmount > maxAllowedValue + 0.01) {
        notify.error(`Valor inválido. O valor máximo permitido é R$ ${maxAllowedValue.toFixed(2)}.`);
        return;
    }

    try {
        const { error } = await supabase
            .from('sale_payments')
            .update({ amount_paid: newAmount })
            .eq('id', editingPaymentId);

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
        {/* ... (código do formulário de novo pagamento igual ao anterior) ... */}
        <div className={styles.summary}>
          <p>Cliente: <strong>{sale.client_name}</strong></p>
          <p>Valor Total: <strong>R$ {sale.total_amount.toFixed(2)}</strong></p>
          <p>Saldo Devedor: <strong className={styles.balance}>R$ {sale.balance.toFixed(2)}</strong></p>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor a Pagar</label>
          <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className={styles.input}/>
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={loading || sale.balance <= 0}>
            {loading ? 'A Registar...' : 'Registar Pagamento'}
          </Button>
        </div>
      </form>

      <div className={styles.paymentsList}>
        <h4>Histórico de Pagamentos</h4>
        {listLoading ? <p>A carregar histórico...</p> : payments.length > 0 ? (
          <ul>
            {payments.map(p => (
              <li key={p.id} className={editingPaymentId === p.id ? styles.editingItem : ''}>
                {editingPaymentId === p.id ? (
                  // MODO DE EDIÇÃO
                  <>
                    <input type="number" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} className={styles.editInput} autoFocus/>
                    <div className={styles.paymentActions}>
                      <Button icon={FaCheck} variant="success" isIconOnly onClick={handleUpdatePayment}>Guardar</Button>
                      <Button icon={FaTimes} variant="ghost" isIconOnly onClick={handleCancelEdit}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  // MODO DE EXIBIÇÃO
                  <>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentDate}>{new Date(p.payment_date).toLocaleDateString()}</span>
                      <span className={styles.paymentAmount}>R$ {p.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className={styles.paymentActions}>
                      <Button icon={FaEdit} isIconOnly onClick={() => handleEditClick(p)}>Editar</Button>
                      <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDeletePayment(p.id)}>Apagar</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noPayments}>Nenhum pagamento registado.</p>
        )}
      </div>
    </div>
  );
};

export default SalePaymentForm;
