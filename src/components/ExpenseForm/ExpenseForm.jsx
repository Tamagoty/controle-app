// src/components/ExpenseForm/ExpenseForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ExpenseForm.module.css';
import Button from '../Button/Button';

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    cost_center_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    employee_id: '',
  });
  const [categories, setCategories] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSalary, setIsSalary] = useState(false);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    const fetchData = async () => {
      const { data: catData } = await supabase.from('expense_categories').select('id, name');
      setCategories(catData || []);
      const { data: ccData } = await supabase.from('cost_centers').select('id, name');
      setCostCenters(ccData || []);
      const { data: empData } = await supabase.from('entity_roles').select('entity:entities!inner(id, name)').eq('role', 'Funcionário');
      setEmployees(empData.map(e => e.entity) || []);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'category_id') {
      const selectedCategory = categories.find(c => c.id.toString() === value);
      setIsSalary(selectedCategory?.name === 'Salários');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSalary && !formData.employee_id) {
      notify.error('Para a categoria "Salários", é obrigatório selecionar um funcionário.');
      return;
    }
    setLoading(true);
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      employee_id: formData.employee_id || null,
    };
    try {
      const { error } = await supabase.from('general_expenses').insert([payload]);
      if (error) throw error;
      notify.success('Despesa registada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao registar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <input id="description" name="description" type="text" value={formData.description} onChange={handleChange} required />
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor (R$)</label>
          <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="expense_date">Data da Despesa</label>
          <input id="expense_date" name="expense_date" type="date" value={formData.expense_date} onChange={handleChange} required />
        </div>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="category_id">Categoria da Despesa</label>
          <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} required>
            <option value="" disabled>Selecione uma categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cost_center_id">Centro de Custo</label>
          <select id="cost_center_id" name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} required>
            <option value="" disabled>Selecione um centro de custo</option>
            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
          </select>
        </div>
      </div>

      {isSalary && (
        <div className={styles.formGroup}>
          <label htmlFor="employee_id">Funcionário (Obrigatório para Salários)</label>
          <select id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleChange} required>
            <option value="" disabled>Selecione um funcionário</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
      )}
      
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar Despesa'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
