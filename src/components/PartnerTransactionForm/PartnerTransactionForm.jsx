// src/components/

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './PartnerTransactionForm.module.css';
import Button from '../Button/Button';

const PartnerTransactionForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    partner_id: '',
    transaction_type: 'Aporte',
    amount: '',
    description: '',
  });
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase.rpc('get_partners_with_details');
      if (data) setPartners(data.filter(p => p.is_active));
    };
    fetchPartners();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('partner_transactions').insert([{
        partner_id: formData.partner_id,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        description: formData.description
      }]);
      if (error) throw error;
      notify.success('Transação registada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao registar a transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="partner_id">Sócio</label>
        <select id="partner_id" name="partner_id" value={formData.partner_id} onChange={handleChange} required>
          <option value="" disabled>Selecione um sócio</option>
          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="transaction_type">Tipo de Transação</label>
          <select id="transaction_type" name="transaction_type" value={formData.transaction_type} onChange={handleChange}>
            <option value="Aporte">Aporte (Entrada)</option>
            <option value="Retirada">Retirada (Saída)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor (R$)</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" value={formData.amount} onChange={handleChange} required />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Registar...' : 'Registar Transação'}
        </Button>
      </div>
    </form>
  );
};

export default PartnerTransactionForm;
