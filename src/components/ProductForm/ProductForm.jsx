// src/components/ProductForm/ProductForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ProductForm.module.css';
import Button from '../Button/Button';
import CurrencyInput from '../CurrencyInput/CurrencyInput'; // <-- NOVO

const ProductForm = ({ productToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sale_price: 0,
    purchase_price: 0,
    product_type: 'Ambos',
    unit_of_measure: 'un',
    category_id: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const isEditing = !!productToEdit;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('product_categories').select('id, name');
      if (data) setCategories(data);
    };
    fetchCategories();

    if (isEditing) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        sale_price: productToEdit.sale_price || 0,
        purchase_price: productToEdit.purchase_price || 0,
        product_type: productToEdit.product_type || 'Ambos',
        unit_of_measure: productToEdit.unit_of_measure || 'un',
        category_id: productToEdit.category_id || '',
      });
    }
  }, [productToEdit, isEditing]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      sale_price: parseFloat(formData.sale_price),
      purchase_price: parseFloat(formData.purchase_price) || 0,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
    };

    try {
      let error;
      if (isEditing) {
        ({ error } = await supabase.from('products').update(payload).eq('id', productToEdit.id));
      } else {
        ({ error } = await supabase.from('products').insert([payload]));
      }
      if (error) throw error;
      notify.success(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} o produto.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome do Produto</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={(e) => handleChange(e.target.name, e.target.value)} required className={styles.input} />
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="purchase_price">Preço de Compra</label>
          <CurrencyInput value={formData.purchase_price} onChange={(value) => handleChange('purchase_price', value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="sale_price">Preço de Venda</label>
          <CurrencyInput value={formData.sale_price} onChange={(value) => handleChange('sale_price', value)} />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="category_id">Categoria</label>
          <select id="category_id" name="category_id" value={formData.category_id} onChange={(e) => handleChange(e.target.name, e.target.value)} className={styles.select}>
            <option value="">Sem categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="product_type">Tipo</label>
          <select id="product_type" name="product_type" value={formData.product_type} onChange={(e) => handleChange(e.target.name, e.target.value)} className={styles.select}>
            <option value="Ambos">Ambos (Venda e Uso)</option>
            <option value="Venda">Apenas Venda</option>
            <option value="Compra">Apenas Uso/Compra</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="unit_of_measure">Unidade de Medida</label>
          <input id="unit_of_measure" name="unit_of_measure" type="text" value={formData.unit_of_measure} onChange={(e) => handleChange(e.target.name, e.target.value)} className={styles.input} />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" value={formData.description} onChange={(e) => handleChange(e.target.name, e.target.value)} className={styles.textarea} />
      </div>

      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar Produto'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
