// src/components/ExpenseForm/ExpenseForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import imageCompression from 'browser-image-compression';
import styles from './ExpenseForm.module.css';
import paymentStyles from '../PaymentSection.module.css';
import Button from '../Button/Button';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import CurrencyInput from '../CurrencyInput/CurrencyInput';

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
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
  const { user } = useAuth();

  // Novos estados para o pagamento imediato
  const [addPayment, setAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentFile, setAttachmentFile] = useState(null);

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

  useEffect(() => {
    if (addPayment) {
        setPaymentAmount(formData.amount);
    } else {
        setPaymentAmount(0);
    }
  }, [addPayment, formData.amount]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'category_id') {
      const selectedCategory = categories.find(c => c.id.toString() === value);
      setIsSalary(selectedCategory?.name === 'Salários');
    }
  };

  const handleFileChange = (e) => {
    setAttachmentFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSalary && !formData.employee_id) {
      notify.error('Para a categoria "Salários", é obrigatório selecionar um funcionário.');
      return;
    }
    setLoading(true);
    
    try {
      const expenseTimestamp = new Date(`${formData.expense_date}T12:00:00`).toISOString();
      const paymentTimestamp = addPayment ? new Date(`${paymentDate}T12:00:00`).toISOString() : new Date().toISOString();

      const { data: expenseData, error } = await supabase.rpc('create_expense_with_details', {
        description_param: formData.description,
        amount_param: formData.amount,
        category_id_param: formData.category_id,
        cost_center_id_param: formData.cost_center_id,
        expense_date_param: expenseTimestamp,
        employee_id_param: formData.employee_id || null,
        payment_amount_param: addPayment ? paymentAmount : 0,
        payment_date_param: paymentTimestamp
      });

      if (error) throw error;
      
      const newExpenseId = expenseData.id;

      if (attachmentFile && newExpenseId) {
        let fileToUpload = attachmentFile;
        if (attachmentFile.type.startsWith('image/')) {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.6 };
            fileToUpload = await imageCompression(attachmentFile, options);
        }
        const filePath = `${user.id}/${newExpenseId}/${Date.now()}_${fileToUpload.name}`;
        await supabase.storage.from('attachments').upload(filePath, fileToUpload);
        await supabase.from('attachments').insert({
            file_path: filePath,
            expense_id: newExpenseId,
            uploaded_by: user.id,
        });
      }

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
        <input id="description" name="description" type="text" value={formData.description} onChange={(e) => handleChange(e.target.name, e.target.value)} required />
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Valor</label>
          <CurrencyInput value={formData.amount} onChange={(value) => handleChange('amount', value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="expense_date">Data da Despesa</label>
          <input id="expense_date" name="expense_date" type="date" value={formData.expense_date} onChange={(e) => handleChange(e.target.name, e.target.value)} required />
        </div>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="category_id">Categoria da Despesa</label>
          <select id="category_id" name="category_id" value={formData.category_id} onChange={(e) => handleChange(e.target.name, e.target.value)} required>
            <option value="" disabled>Selecione uma categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cost_center_id">Centro de Custo</label>
          <select id="cost_center_id" name="cost_center_id" value={formData.cost_center_id} onChange={(e) => handleChange(e.target.name, e.target.value)} required>
            <option value="" disabled>Selecione um centro de custo</option>
            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
          </select>
        </div>
      </div>

      {isSalary && (
        <div className={styles.formGroup}>
          <label htmlFor="employee_id">Funcionário (Obrigatório para Salários)</label>
          <select id="employee_id" name="employee_id" value={formData.employee_id} onChange={(e) => handleChange(e.target.name, e.target.value)} required>
            <option value="" disabled>Selecione um funcionário</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
      )}
      
      <div className={paymentStyles.paymentSection}>
        <div className={paymentStyles.paymentHeader}>
            <ToggleSwitch label="Adicionar Pagamento Imediato" checked={addPayment} onChange={setAddPayment} />
        </div>
        {addPayment && (
            <div className={paymentStyles.paymentFields}>
                <div className={paymentStyles.formGroup}>
                    <label htmlFor="paymentAmount">Valor Pago</label>
                    <CurrencyInput value={paymentAmount} onChange={setPaymentAmount} />
                </div>
                <div className={paymentStyles.formGroup}>
                    <label htmlFor="paymentDate">Data do Pagamento</label>
                    <input id="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className={paymentStyles.input} />
                </div>
                <div className={paymentStyles.formGroup}>
                    <label htmlFor="attachment">Anexar Comprovativo</label>
                    <input id="attachment" type="file" accept="image/*,.pdf" onChange={handleFileChange} className={paymentStyles.fileInput} />
                </div>
            </div>
        )}
      </div>

      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar Despesa'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
