// src/components/ProductForm/ProductForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ProductForm.module.css';
import Button from '../Button/Button';

const ProductForm = ({ productToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sale_price: '',
    purchase_price: '',
    product_type: 'Ambos',
    unit_of_measure: 'un',
    category_id: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const isEditing = !!productToEdit;

  useEffect(() => {
    // Busca as categorias de produtos para popular o dropdown
    const fetchCategories = async () => {
      const { data } = await supabase.from('product_categories').select('id, name');
      if (data) setCategories(data);
    };
    fetchCategories();

    if (isEditing) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        sale_price: productToEdit.sale_price || '',
        purchase_price: productToEdit.purchase_price || '',
        product_type: productToEdit.product_type || 'Ambos',
        unit_of_measure: productToEdit.unit_of_measure || 'un',
        category_id: productToEdit.category_id || '',
      });
    }
  }, [productToEdit, isEditing]);

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
      sale_price: parseFloat(formData.sale_price),
      purchase_price: parseFloat(formData.purchase_price),
      product_type: formData.product_type,
      unit_of_measure: formData.unit_of_measure,
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
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="purchase_price">Preço de Compra (R$)</label>
          <input id="purchase_price" name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="sale_price">Preço de Venda (R$)</label>
          <input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} required />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="category_id">Categoria</label>
          <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange}>
            <option value="">Sem categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="product_type">Tipo</label>
          <select id="product_type" name="product_type" value={formData.product_type} onChange={handleChange}>
            <option value="Ambos">Ambos (Venda e Uso)</option>
            <option value="Venda">Apenas Venda</option>
            <option value="Compra">Apenas Uso/Compra</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="unit_of_measure">Unidade de Medida</label>
          <input id="unit_of_measure" name="unit_of_measure" type="text" value={formData.unit_of_measure} onChange={handleChange} />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
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
