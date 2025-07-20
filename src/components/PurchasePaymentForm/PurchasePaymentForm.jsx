// src/components/PurchasePaymentForm/PurchasePaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import FileUploader from '../FileUploader/FileUploader';
import styles from './PurchasePaymentForm.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const PurchasePaymentForm = ({ purchase, onSuccess }) => {
  const [amount, setAmount] = useState(purchase.balance > 0 ? purchase.balance.toFixed(2) : '0.00');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const notify = useNotify();

  const handleFocus = (event) => event.target.select();

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase
          .from('purchase_payments')
          .select('*')
          .eq('purchase_id', purchase.id)
          .order('payment_date', { ascending: false });
        
        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        notify.error(err.message || "Não foi possível carregar os pagamentos existentes.");
      } finally {
        setListLoading(false);
      }
    };

    if (purchase.id) {
        fetchPayments();
    }
  }, [purchase.id, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > purchase.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('purchase_payments').insert({
        purchase_id: purchase.id,
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

  const handleDeletePayment = (paymentId) => {
    setPaymentToDelete(paymentId);
    setIsConfirmModalOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const { error } = await supabase.from('purchase_payments').delete().eq('id', paymentToDelete);
      if (error) throw error;
      notify.success('Pagamento apagado com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao apagar o pagamento.');
    } finally {
      setIsConfirmModalOpen(false);
      setPaymentToDelete(null);
    }
  };

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
    const otherPaymentsTotal = purchase.total_paid - paymentToEdit.amount_paid;
    const maxAllowedValue = purchase.total_amount - otherPaymentsTotal;
    const newAmount = parseFloat(editingAmount);

    if (!newAmount || newAmount <= 0 || newAmount > maxAllowedValue + 0.01) {
        notify.error(`Valor inválido. O valor máximo permitido é R$ ${maxAllowedValue.toFixed(2)}.`);
        return;
    }

    try {
        const { error } = await supabase
            .from('purchase_payments')
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
        <div className={styles.summary}>
          <p>Fornecedor: <strong>{purchase.supplier_name}</strong></p>
          <p>Valor Total: <strong>R$ {purchase.total_amount.toFixed(2)}</strong></p>
          <p>Saldo a Pagar: <strong className={styles.balance}>R$ {purchase.balance.toFixed(2)}</strong></p>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor a Pagar</label>
          <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={handleFocus} required className={styles.input} />
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={loading || purchase.balance <= 0}>
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
                  <>
                    <input type="number" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} onFocus={handleFocus} className={styles.editInput} autoFocus/>
                    <div className={styles.paymentActions}>
                      <Button icon={FaCheck} variant="success" isIconOnly onClick={handleUpdatePayment}>Guardar</Button>
                      <Button icon={FaTimes} variant="ghost" isIconOnly onClick={handleCancelEdit}>Cancelar</Button>
                    </div>
                  </>
                ) : (
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
          <p className={styles.noPayments}>Nenhum pagamento registado para esta compra.</p>
        )}
      </div>

      <FileUploader key={purchase.id} recordId={purchase.id} recordType="purchase" />

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar este pagamento? Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDeletePayment}>Apagar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchasePaymentForm;
