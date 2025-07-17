// src/components/ExpenseCategoryForm/ExpenseCategoryForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ExpenseCategoryForm.module.css';
import Button from '../Button/Button';

const ExpenseCategoryForm = ({ categoryToEdit, onSuccess }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const isEditing = !!categoryToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(categoryToEdit.name);
    }
  }, [categoryToEdit, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let error;
      if (isEditing) {
        ({ error } = await supabase.from('expense_categories').update({ name }).eq('id', categoryToEdit.id));
      } else {
        ({ error } = await supabase.from('expense_categories').insert([{ name }]));
      }
      if (error) throw error;
      notify.success(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao guardar a categoria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome da Categoria</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseCategoryForm;
