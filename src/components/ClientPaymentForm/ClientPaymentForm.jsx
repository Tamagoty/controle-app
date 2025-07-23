// src/components/ClientPaymentForm/ClientPaymentForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import Button from '../Button/Button';
import styles from './ClientPaymentForm.module.css';
import CurrencyInput from '../CurrencyInput/CurrencyInput';
import imageCompression from 'browser-image-compression';

const ClientPaymentForm = ({ client, onSuccess }) => {
  const [amount, setAmount] = useState(client.balance > 0 ? client.balance : 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const { user, profile } = useAuth();

  const handleFileChange = (e) => {
    setAttachmentFile(e.target.files[0]);
  };

  // --- FUNÇÃO PARA SELECIONAR O TEXTO AO FOCAR ---
  const handleFocus = (event) => event.target.select();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!amount || amount <= 0 || amount > client.balance + 0.01) {
      notify.error('O valor do pagamento é inválido.');
      setLoading(false);
      return;
    }

    try {
      const { data: paymentData, error } = await supabase.rpc('pay_client_debt', {
        p_client_id: client.client_id,
        p_payment_amount: amount,
        p_payment_date: new Date(`${paymentDate}T12:00:00`).toISOString()
      });

      if (error) throw error;
      
      // A RPC agora retorna o ID do primeiro pagamento criado
      const newPaymentId = paymentData[0]?.payment_id;

      if (attachmentFile && newPaymentId) {
        let fileToUpload = attachmentFile;
        if (attachmentFile.type.startsWith('image/')) {
            const { image_quality, max_size_mb, max_width_or_height } = profile.media_settings;
            const options = { maxSizeMB: max_size_mb, maxWidthOrHeight: max_width_or_height, useWebWorker: true, initialQuality: image_quality };
            fileToUpload = await imageCompression(attachmentFile, options);
        }
        const filePath = `${user.id}/${newPaymentId}/${Date.now()}_${fileToUpload.name}`;
        await supabase.storage.from('attachments').upload(filePath, fileToUpload);
        await supabase.from('attachments').insert({
            file_path: filePath,
            sale_payment_id: newPaymentId,
            uploaded_by: user.id,
        });
      }

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
        <p>Dívida Total: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_due)}</strong></p>
        <p>Saldo Devedor: <strong className={styles.balance}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.balance)}</strong></p>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
            <label htmlFor="amount">Valor Recebido</label>
            <CurrencyInput value={amount} onChange={setAmount} onFocus={handleFocus} />
        </div>
        <div className={styles.formGroup}>
            <label htmlFor="paymentDate">Data do Recebimento</label>
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
      <div className={styles.formGroup}>
        <label htmlFor="attachment">Anexar Comprovativo (Opcional)</label>
        <input id="attachment" type="file" accept="image/*,.pdf" onChange={handleFileChange} className={styles.fileInput} />
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
