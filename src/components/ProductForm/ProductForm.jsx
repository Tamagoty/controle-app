// src/components/ProductForm/ProductForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './ProductForm.module.css';
import Button from '../Button/Button';

/**
 * Formulário para criar ou editar um produto.
 * @param {object} props
 * @param {() => void} props.onSuccess - Função chamada após a criação bem-sucedida.
 */
const ProductForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
            name: name, 
            sale_price: parseFloat(salePrice), 
            description: description 
        }])
        .select();

      if (error) {
        throw error;
      }

      notify.success('Produto criado com sucesso!');
      if (onSuccess) {
        onSuccess(data[0]); // Passa o novo produto para a função de callback
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      notify.error(error.message || 'Falha ao criar o produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome do Produto</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="sale_price">Preço de Venda</label>
        <input
          id="sale_price"
          type="number"
          step="0.01"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
        />
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
