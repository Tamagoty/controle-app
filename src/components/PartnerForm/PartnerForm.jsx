// src/components/PartnerForm/PartnerForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './PartnerForm.module.css';
import Button from '../Button/Button';

const PartnerForm = ({ partnerToEdit, onSuccess, currentTotalEquity }) => {
  const [equityPercentage, setEquityPercentage] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  // A principal mudança de lógica: verificamos se já existe um registo de sócio (partnerToEdit.id).
  const isCompletingRegistration = !partnerToEdit.id;

  useEffect(() => {
    // Preenche o formulário com os dados existentes, ou com valores padrão se for um registo novo.
    if (partnerToEdit) {
      setEquityPercentage(partnerToEdit.equity_percentage || '');
      setEntryDate(partnerToEdit.entry_date ? new Date(partnerToEdit.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    }
  }, [partnerToEdit]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newEquity = parseFloat(equityPercentage);
    const equityBeingEdited = !isCompletingRegistration ? parseFloat(partnerToEdit.equity_percentage) : 0;
    const equityOfOthers = currentTotalEquity - equityBeingEdited;

    if (equityOfOthers + newEquity > 100) {
      notify.error(`A participação não pode exceder 100%. Restam ${(100 - equityOfOthers).toFixed(2)}%.`);
      return;
    }

    setLoading(true);

    try {
      let error;

      if (isCompletingRegistration) {
        // MODO DE COMPLETAR REGISTO: Insere um novo registo na tabela 'partners'
        const payload = {
          entity_id: partnerToEdit.entity_id, // Usa o ID da pessoa que já existe
          equity_percentage: newEquity,
          entry_date: entryDate,
        };
        ({ error } = await supabase.from('partners').insert([payload]));
      } else {
        // MODO DE EDIÇÃO: Atualiza o registo existente
        const payload = {
          equity_percentage: newEquity,
          entry_date: entryDate,
        };
        ({ error } = await supabase.from('partners').update(payload).eq('id', partnerToEdit.id));
      }
      
      if (error) throw error;
      notify.success(`Sócio ${isCompletingRegistration ? 'registado' : 'atualizado'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || `Falha ao ${isCompletingRegistration ? 'registar' : 'atualizar'} sócio.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label>Sócio</label>
        {/* O nome do sócio agora é apenas um texto informativo, pois não pode ser alterado aqui. */}
        <p className={styles.partnerName}>{partnerToEdit.name}</p>
      </div>
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="equityPercentage">Participação (%)</label>
          <input id="equityPercentage" type="number" step="0.01" min="0.01" max="100" value={equityPercentage} onChange={(e) => setEquityPercentage(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="entryDate">Data de Entrada</label>
          <input id="entryDate" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </div>
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>{loading ? 'A Guardar...' : 'Guardar'}</Button>
      </div>
    </form>
  );
};

export default PartnerForm;
