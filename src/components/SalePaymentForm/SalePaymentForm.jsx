// src/components/SalePaymentForm/SalePaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import styles from './SalePaymentForm.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import CurrencyInput from '../CurrencyInput/CurrencyInput';
import imageCompression from 'browser-image-compression';
import FileUploader from '../FileUploader/FileUploader'; // <-- A CORREÇÃO ESTÁ AQUI

const SalePaymentForm = ({ sale, onSuccess }) => {
  const [amount, setAmount] = useState(sale.balance > 0 ? sale.balance : 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const { user, profile } = useAuth();
  const notify = useNotify();

  const handleFocus = (event) => event.target.select();
  const handleFileChange = (e) => setAttachmentFile(e.target.files[0]);

  useEffect(() => {
    const fetchPayments = async () => {
      setListLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_sale_payments', { p_sale_id: sale.id });
        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        notify.error(err.message || "Não foi possível carregar os pagamentos existentes.");
      } finally {
        setListLoading(false);
      }
    };
    if (sale.id) fetchPayments();
  }, [sale.id, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!amount || amount <= 0 || amount > sale.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { data: newPayment, error } = await supabase.from('sale_payments').insert({
        sale_id: sale.id,
        amount_paid: amount,
        payment_date: new Date(`${paymentDate}T12:00:00`).toISOString(),
      }).select().single();

      if (error) throw error;

      if (attachmentFile && newPayment.id) {
        let fileToUpload = attachmentFile;
        if (attachmentFile.type.startsWith('image/')) {
            const { image_quality, max_size_mb, max_width_or_height } = profile.media_settings;
            const options = { maxSizeMB: max_size_mb, maxWidthOrHeight: max_width_or_height, useWebWorker: true, initialQuality: image_quality };
            fileToUpload = await imageCompression(attachmentFile, options);
        }
        const filePath = `${user.id}/${newPayment.id}/${Date.now()}_${fileToUpload.name}`;
        await supabase.storage.from('attachments').upload(filePath, fileToUpload);
        await supabase.from('attachments').insert({
            file_path: filePath,
            sale_payment_id: newPayment.id,
            uploaded_by: user.id,
        });
      }

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
      const { error } = await supabase.from('sale_payments').delete().eq('id', paymentToDelete);
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
    setEditingPayment({
        id: payment.id,
        amount_paid: payment.amount_paid,
        payment_date: new Date(payment.payment_date).toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => setEditingPayment(null);

  const handleUpdatePayment = async () => {
    // ... (lógica de validação)
    try {
        const { error } = await supabase
            .from('sale_payments')
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
          <p>Cliente: <strong>{sale.client_name}</strong></p>
          <p>Valor Total: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_amount)}</strong></p>
          <p>Saldo Devedor: <strong className={styles.balance}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.balance)}</strong></p>
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
        <div className={styles.formGroup}>
          <label htmlFor="attachment">Anexar Comprovativo (Opcional)</label>
          <input id="attachment" type="file" accept="image/*,.pdf" onChange={handleFileChange} className={styles.fileInput} />
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={loading || sale.balance <= 0}>
            {loading ? 'A Registar...' : 'Registar Pagamento'}
          </Button>
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
                      <Button icon={FaCheck} variant="success" isIconOnly onClick={handleUpdatePayment} />
                      <Button icon={FaTimes} variant="ghost" isIconOnly onClick={handleCancelEdit} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentDate}>{new Date(p.payment_date).toLocaleDateString()}</span>
                      <span className={styles.paymentAmount}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount_paid)}</span>
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
      
      <FileUploader key={sale.id} recordId={sale.id} recordType="sale" />

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar este pagamento?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDeletePayment}>Apagar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalePaymentForm;
