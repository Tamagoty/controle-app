// src/components/CostCenterForm/CostCenterForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './CostCenterForm.module.css';
import Button from '../Button/Button';

const CostCenterForm = ({ costCenterToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const isEditing = !!costCenterToEdit;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: costCenterToEdit.name || '',
        description: costCenterToEdit.description || '',
      });
    }
  }, [costCenterToEdit, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
    };

    try {
      let error;
      if (isEditing) {
        ({ error } = await supabase.from('cost_centers').update(payload).eq('id', costCenterToEdit.id));
      } else {
        ({ error } = await supabase.from('cost_centers').insert([payload]));
      }
      if (error) throw error;
      notify.success(`Centro de Custo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome do Centro de Custo</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};

export default CostCenterForm;
