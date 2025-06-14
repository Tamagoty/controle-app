// src/pages/Financeiro/ContasAReceber.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaHandHoldingUsd } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ClientPaymentForm from '../../components/ClientPaymentForm/ClientPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { useNotify } from '../../hooks/useNotify';

const ContasAReceber = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const notify = useNotify();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_accounts_receivable_summary');
      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSuccess = () => {
    fetchSummary();
    setIsModalOpen(false);
  };

  const openPaymentModal = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Cliente', key: 'client_name', accessor: 'client_name', sortable: true },
    { 
      header: 'Status da Dívida', 
      key: 'balance', 
      sortable: true,
      Cell: ({ row }) => <ProgressBar total={row.total_due} paid={row.total_paid} />
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => (
        <Button 
          icon={FaHandHoldingUsd} 
          isIconOnly 
          onClick={() => openPaymentModal(row)}
          disabled={row.balance <= 0}
        >
          Receber Pagamento
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Contas a Receber</h1>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar resumo...</p>
        ) : (
          <Table 
            columns={columns} 
            data={summary}
          />
        )}
      </Card>

      {selectedClient && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`Receber de ${selectedClient.client_name}`}
        >
          <ClientPaymentForm client={selectedClient} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default ContasAReceber;
