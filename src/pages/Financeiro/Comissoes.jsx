// src/pages/Financeiro/Comissoes.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaMoneyBillWave } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import CommissionPaymentForm from '../../components/CommissionPaymentForm/CommissionPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { useNotify } from '../../hooks/useNotify';

const Comissoes = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const notify = useNotify();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      // Chama a nova função RPC global
      const { data, error } = await supabase.rpc('get_commission_summary');
      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar o resumo de comissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSuccess = () => {
    fetchSummary(); // Recarrega os dados globais
    setIsModalOpen(false);
  };

  const openPaymentModal = (seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Vendedor', key: 'seller_name', accessor: 'seller_name' },
    { 
      header: 'Status Pagamento de Comissão', 
      key: 'balance', 
      Cell: ({ row }) => <ProgressBar total={row.total_commission_due} paid={row.total_commission_paid} />
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => (
        <Button 
          icon={FaMoneyBillWave} 
          isIconOnly 
          onClick={() => openPaymentModal(row)}
        >
          Gerir Pagamentos
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Controlo de Comissões</h1>
      </div>
      
      <Card>
        {loading ? <p>A carregar resumo...</p> : <Table columns={columns} data={summary} />}
      </Card>

      {selectedSeller && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`Gerir Comissões de ${selectedSeller.seller_name}`}
        >
          <CommissionPaymentForm seller={selectedSeller} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Comissoes;
