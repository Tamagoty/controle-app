// src/components/ProductForm/ProductForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ProductForm.module.css';
import Button from '../Button/Button';

/**
 * Formulário para criar ou editar um produto.
 * @param {object} props
 * @param {object} [props.productToEdit] - Os dados do produto a ser editado.
 * @param {() => void} props.onSuccess - Função chamada após uma ação bem-sucedida.
 */
const ProductForm = ({ productToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sale_price: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const isEditing = !!productToEdit;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: productToEdit.name || '',
        sale_price: productToEdit.sale_price || '',
        description: productToEdit.description || '',
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
      sale_price: parseFloat(formData.sale_price),
      description: formData.description,
    };

    try {
      let error;

      if (isEditing) {
        // Modo de Edição
        ({ error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productToEdit.id));
      } else {
        // Modo de Criação
        ({ error } = await supabase
          .from('products')
          .insert([payload]));
      }
      
      if (error) throw error;

      notify.success(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao guardar produto:', error);
      notify.error(error.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} o produto.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome do Produto</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className={styles.input}/>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="sale_price">Preço de Venda</label>
        <input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} required className={styles.input}/>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} className={styles.textarea}/>
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
