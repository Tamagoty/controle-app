// src/components/PurchaseForm/PurchaseForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import { useSessionDefaults } from '../../context/SessionDefaultsContext';
import imageCompression from 'browser-image-compression';
import styles from './PurchaseForm.module.css';
import paymentStyles from '../PaymentSection.module.css';
import Button from '../Button/Button';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import CurrencyInput from '../CurrencyInput/CurrencyInput';
import { FaThumbtack } from 'react-icons/fa';

const PurchaseForm = ({ onSuccess }) => {
  const { sessionDefaults, updateDefault } = useSessionDefaults();
  const [supplierId, setSupplierId] = useState('');
  const [costCenterId, setCostCenterId] = useState(sessionDefaults.costCenterId || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [suppliers, setSuppliers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const { user } = useAuth();

  const [addPayment, setAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentFile, setAttachmentFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: suppliersData } = await supabase.from('entity_roles').select(`entity:entities (id, name)`).eq('role', 'Fornecedor');
      setSuppliers(suppliersData.map(s => s.entity));
      const { data: costCentersData } = await supabase.from('cost_centers').select('id, name');
      setCostCenters(costCentersData);
      const { data: productsData } = await supabase.from('products').select('id, name, purchase_price');
      setProducts(productsData);
    };
    fetchData();
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
  }, [items]);

  useEffect(() => {
    if (addPayment) {
        setPaymentAmount(totalAmount);
    } else {
        setPaymentAmount(0);
    }
  }, [addPayment, totalAmount]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    currentItem[field] = value;
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        currentItem.unit_price = selectedProduct.purchase_price;
      }
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleFileChange = (e) => setAttachmentFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    updateDefault('costCenterId', costCenterId);

    const itemsPayload = items.map(item => ({
      product_id: item.product_id,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price)
    }));

    try {
      // CORREÇÃO: Converte as datas para o formato ISO completo para evitar problemas de fuso horário.
      const purchaseTimestamp = new Date(`${purchaseDate}T00:00:00`).toISOString();
      const paymentTimestamp = addPayment ? new Date(`${paymentDate}T00:00:00`).toISOString() : new Date().toISOString();

      const { data: purchaseData, error } = await supabase.rpc('create_purchase_with_details', {
        supplier_id_param: supplierId,
        cost_center_id_param: costCenterId,
        items_param: itemsPayload,
        purchase_date_param: purchaseTimestamp,
        payment_amount_param: addPayment ? paymentAmount : 0,
        payment_date_param: paymentTimestamp
      });
      if (error) throw error;
      const newPurchaseId = purchaseData.id;
      if (attachmentFile && newPurchaseId) {
        let fileToUpload = attachmentFile;
        if (attachmentFile.type.startsWith('image/')) {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.6 };
            fileToUpload = await imageCompression(attachmentFile, options);
        }
        const filePath = `${user.id}/${newPurchaseId}/${Date.now()}_${fileToUpload.name}`;
        await supabase.storage.from('attachments').upload(filePath, fileToUpload);
        await supabase.from('attachments').insert({
            file_path: filePath,
            purchase_id: newPurchaseId,
            uploaded_by: user.id,
        });
      }
      notify.success('Compra registada com sucesso!');
      if (onSuccess) onSuccess();
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
          <label htmlFor="purchaseDate">Data da Compra</label>
          <input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="cost_center" className={styles.labelWithIcon}>
            Centro de Custo
            {sessionDefaults.costCenterId && <FaThumbtack title="Valor padrão da sessão" />}
          </label>
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
            <div className={`${styles.formGroup} ${styles.productGroup}`}>
              <label>Produto</label>
              <select value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required className={styles.select}>
                <option value="" disabled>Selecione</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.quantityGroup}`}>
              <label>Quantidade</label>
              <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required className={styles.input} step="0.001" min="0.001"/>
            </div>
            <div className={`${styles.formGroup} ${styles.priceGroup}`}>
              <label>Preço Unit.</label>
              <CurrencyInput value={item.unit_price} onChange={(value) => handleItemChange(index, 'unit_price', value)} />
            </div>
            <Button type="button" variant="danger" isIconOnly onClick={() => removeItem(index)}>&times;</Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" onClick={addItem}>Adicionar Item</Button>
      
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
      
      <div className={styles.footer}>
        <div className={styles.total}>
          Total: <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
        </div>
        <Button type="submit" disabled={loading || !supplierId || !costCenterId || items.some(i => !i.product_id)}>
          {loading ? 'A Guardar...' : 'Guardar Compra'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
