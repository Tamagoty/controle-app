// src/pages/Compras.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import PurchaseForm from '../components/PurchaseForm/PurchaseForm'; // Importamos o novo formulário
import { useNotify } from '../hooks/useNotify';

const Compras = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notify = useNotify();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchase_date,
          total_amount,
          supplier:entities ( name ),
          cost_center:cost_centers ( name )
        `)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(p => ({
        ...p,
        supplier_name: p.supplier.name,
        cost_center_name: p.cost_center.name,
        purchase_date: new Date(p.purchase_date).toLocaleDateString(),
      }));
      
      setPurchases(formattedData);

    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      notify.error('Não foi possível carregar as compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleNewPurchaseSuccess = () => {
    fetchPurchases(); // Recarrega a lista de compras
    setIsModalOpen(false); // Fecha o modal
  };
  
  const columns = [
    { header: 'Data', accessor: 'purchase_date' },
    { header: 'Fornecedor', accessor: 'supplier_name' },
    { header: 'Centro de Custo', accessor: 'cost_center_name' },
    { header: 'Valor Total', accessor: 'total_amount' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Compras</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Nova Compra
        </Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar compras...</p>
        ) : (
          <Table columns={columns} data={purchases} />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registar Nova Compra"
      >
        {/* Usamos o nosso novo formulário aqui */}
        <PurchaseForm onSuccess={handleNewPurchaseSuccess} />
      </Modal>
    </div>
  );
};

export default Compras;
