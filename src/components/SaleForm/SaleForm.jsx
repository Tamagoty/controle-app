// src/components/SaleForm/SaleForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import { useSessionDefaults } from '../../context/SessionDefaultsContext';
import imageCompression from 'browser-image-compression';
import styles from './SaleForm.module.css';
import paymentStyles from '../PaymentSection.module.css';
import Button from '../Button/Button';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import CurrencyInput from '../CurrencyInput/CurrencyInput';
import { FaThumbtack } from 'react-icons/fa';

const SaleForm = ({ onSuccess }) => {
  const { sessionDefaults, updateDefault } = useSessionDefaults();
  const [clientId, setClientId] = useState('');
  const [sellerId, setSellerId] = useState(sessionDefaults.sellerId || '');
  const [costCenterId, setCostCenterId] = useState(sessionDefaults.costCenterId || '');
  const [commissionPercentage, setCommissionPercentage] = useState(sessionDefaults.commissionPercentage || 0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [clients, setClients] = useState([]);
  const [sellers, setSellers] = useState([]);
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
      if (selectedProduct) currentItem.unit_price = selectedProduct.sale_price;
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
    updateDefault('sellerId', sellerId);
    updateDefault('commissionPercentage', commissionPercentage);

    const itemsPayload = items.map(item => ({
      product_id: item.product_id,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price)
    }));
    try {
      // CORREÇÃO: Converte as datas para o formato ISO completo para evitar problemas de fuso horário.
      const saleTimestamp = new Date(`${saleDate}T00:00:00`).toISOString();
      const paymentTimestamp = addPayment ? new Date(`${paymentDate}T00:00:00`).toISOString() : new Date().toISOString();

      const { data: saleData, error } = await supabase.rpc('create_sale_with_details', {
        client_id_param: clientId,
        seller_id_param: sellerId || null,
        cost_center_id_param: costCenterId,
        commission_percentage_param: parseFloat(commissionPercentage) || 0,
        items_param: itemsPayload,
        sale_date_param: saleTimestamp,
        payment_amount_param: addPayment ? paymentAmount : 0,
        payment_date_param: paymentTimestamp
      });
      if (error) throw error;
      
      const newSaleId = saleData.id;

      if (attachmentFile && newSaleId) {
        let fileToUpload = attachmentFile;
        if (attachmentFile.type.startsWith('image/')) {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.6 };
            fileToUpload = await imageCompression(attachmentFile, options);
        }
        const filePath = `${user.id}/${newSaleId}/${Date.now()}_${fileToUpload.name}`;
        await supabase.storage.from('attachments').upload(filePath, fileToUpload);
        await supabase.from('attachments').insert({
            file_path: filePath,
            sale_id: newSaleId,
            uploaded_by: user.id,
        });
      }
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
        <div className={styles.formGroup}>
          <label htmlFor="client">Cliente</label>
          <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} required className={styles.select}>
            <option value="" disabled>Selecione um cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="saleDate">Data da Venda</label>
          <input id="saleDate" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="seller" className={styles.labelWithIcon}>
            Vendedor (Opcional)
            {sessionDefaults.sellerId && <FaThumbtack title="Valor padrão da sessão" />}
          </label>
          <select id="seller" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={styles.select}>
            <option value="">Nenhum</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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
        <div className={styles.formGroup}>
          <label htmlFor="commission" className={styles.labelWithIcon}>
            Comissão (%)
            {sessionDefaults.commissionPercentage && <FaThumbtack title="Valor padrão da sessão" />}
          </label>
          <input id="commission" type="number" step="0.01" min="0" max="100" value={commissionPercentage} onChange={(e) => setCommissionPercentage(e.target.value)} className={styles.input}/>
        </div>
      </div>
      
      <h3 className={styles.itemsTitle}>Itens da Venda</h3>
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
                    <label htmlFor="paymentAmount">Valor Recebido</label>
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
        <div className={styles.total}>Total: <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span></div>
        <Button type="submit" disabled={loading || !clientId || !costCenterId || items.some(i => !i.product_id)}>
          {loading ? 'A Guardar...' : 'Guardar Venda'}
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
