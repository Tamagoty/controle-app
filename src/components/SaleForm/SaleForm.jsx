// src/components/SaleForm/SaleForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './SaleForm.module.css';
import Button from '../Button/Button';

const SaleForm = ({ onSuccess }) => {
  const [clientId, setClientId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(0); // <-- NOVO ESTADO
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: '' }]);
  const [clients, setClients] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase.from('entity_roles').select(`entity:entities!inner(id, name)`).eq('role', 'Cliente');
      if (clientsData) setClients(clientsData.map(c => c.entity));
      const { data: sellersData } = await supabase.from('entity_roles').select(`entity:entities!inner(id, name)`).eq('role', 'Funcionário');
      if (sellersData) setSellers(sellersData.map(s => s.entity));
      const { data: costCentersData } = await supabase.from('cost_centers').select('id, name');
      if (costCentersData) setCostCenters(costCentersData);
      const { data: productsData } = await supabase.from('products').select('id, name, sale_price');
      if (productsData) setProducts(productsData);
    };
    fetchData();
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => total + (item.quantity || 0) * (item.unit_price || 0), 0);
  }, [items]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    currentItem[field] = value;
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) currentItem.unit_price = selectedProduct.sale_price;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: '' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const itemsPayload = items.map(item => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price)
    }));
    try {
      const { error } = await supabase.rpc('create_sale_with_items', {
        client_id_param: clientId,
        seller_id_param: sellerId || null,
        cost_center_id_param: costCenterId,
        commission_percentage_param: parseFloat(commissionPercentage) || 0, // <-- NOVO DADO
        items_param: itemsPayload
      });
      if (error) throw error;
      notify.success('Venda registada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao registar venda:', error);
      notify.error(error.message || 'Falha ao registar a venda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.headerFields}>
        {/* ... (campos de cliente e vendedor iguais) ... */}
        <div className={styles.formGroup}>
          <label htmlFor="client">Cliente</label>
          <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} required className={styles.select}>
            <option value="" disabled>Selecione um cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="seller">Vendedor (Opcional)</label>
          <select id="seller" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={styles.select}>
            <option value="">Nenhum</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cost_center">Centro de Custo</label>
          <select id="cost_center" value={costCenterId} onChange={(e) => setCostCenterId(e.target.value)} required className={styles.select}>
            <option value="" disabled>Selecione um centro de custo</option>
            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
          </select>
        </div>
        {/* NOVO CAMPO PARA A COMISSÃO */}
        <div className={styles.formGroup}>
          <label htmlFor="commission">Comissão (%)</label>
          <input id="commission" type="number" step="0.01" min="0" max="100" value={commissionPercentage} onChange={(e) => setCommissionPercentage(e.target.value)} className={styles.input}/>
        </div>
      </div>
      
      <h3 className={styles.itemsTitle}>Itens da Venda</h3>
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
        <div className={styles.total}>Total: <span>R$ {totalAmount.toFixed(2)}</span></div>
        <Button type="submit" disabled={loading || !clientId || !costCenterId || items.some(i => !i.product_id)}>
          {loading ? 'A Guardar...' : 'Guardar Venda'}
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
