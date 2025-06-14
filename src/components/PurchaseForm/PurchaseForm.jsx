// src/components/PurchaseForm/PurchaseForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './PurchaseForm.module.css';
import Button from '../Button/Button';

const PurchaseForm = ({ onSuccess }) => {
  const [supplierId, setSupplierId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: '' }]);
  const [suppliers, setSuppliers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    const fetchData = async () => {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('entity_roles')
        .select(`entity:entities (id, name)`)
        .eq('role', 'Fornecedor');
      if (suppliersError) console.error('Error fetching suppliers:', suppliersError);
      else setSuppliers(suppliersData.map(s => s.entity));

      const { data: costCentersData, error: costCentersError } = await supabase
        .from('cost_centers').select('id, name');
      if (costCentersError) console.error('Error fetching cost centers:', costCentersError);
      else setCostCenters(costCentersData);
      
      const { data: productsData, error: productsError } = await supabase
        .from('products').select('id, name, sale_price');
      if (productsError) console.error('Error fetching products:', productsError);
      else setProducts(productsData);
    };
    fetchData();
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => {
      const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
      return total + itemTotal;
    }, 0);
  }, [items]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    currentItem[field] = value;

    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        currentItem.unit_price = selectedProduct.sale_price;
      }
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: '' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Prepara a lista de itens para ser enviada como JSON para a função
    const itemsPayload = items.map(item => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price)
    }));

    try {
      // Chama a função RPC que criamos no Supabase
      const { data, error } = await supabase.rpc('create_purchase_with_items', {
        supplier_id_param: supplierId,
        cost_center_id_param: costCenterId,
        items_param: itemsPayload
      });

      if (error) {
        throw error;
      }

      notify.success('Compra registada com sucesso!');
      if (onSuccess) {
        onSuccess(); // Chama a função para fechar o modal e recarregar a lista
      }
    } catch (error) {
      console.error('Erro ao registar compra:', error);
      notify.error(error.message || 'Falha ao registar a compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.headerFields}>
        <div className={styles.formGroup}>
          <label htmlFor="supplier">Fornecedor</label>
          <select id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required className={styles.select}>
            <option value="" disabled>Selecione um fornecedor</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cost_center">Centro de Custo</label>
          <select id="cost_center" value={costCenterId} onChange={(e) => setCostCenterId(e.target.value)} required className={styles.select}>
            <option value="" disabled>Selecione um centro de custo</option>
            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
          </select>
        </div>
      </div>
      
      <h3 className={styles.itemsTitle}>Itens da Compra</h3>
      <div className={styles.itemsList}>
        {items.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <select value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required className={styles.select}>
              <option value="" disabled>Selecione um produto</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Qtd." value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required className={styles.input} min="1"/>
            <input type="number" placeholder="Preço Unit." step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required className={styles.input} min="0"/>
            <Button type="button" variant="danger" onClick={() => removeItem(index)}>&times;</Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" onClick={addItem}>Adicionar Item</Button>
      
      <div className={styles.footer}>
        <div className={styles.total}>
          Total: <span>R$ {totalAmount.toFixed(2)}</span>
        </div>
        <Button type="submit" disabled={loading || !supplierId || !costCenterId || items.some(i => !i.product_id)}>
          {loading ? 'A Guardar...' : 'Guardar Compra'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
