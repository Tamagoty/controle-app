// src/pages/Financeiro/ContasAPagar.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPaperPlane } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import SupplierPaymentForm from '../../components/SupplierPaymentForm/SupplierPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { useNotify } from '../../hooks/useNotify';

const ContasAPagar = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const notify = useNotify();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_accounts_payable_summary');
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

  const openPaymentModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Fornecedor', key: 'supplier_name', accessor: 'supplier_name', sortable: true },
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
          icon={FaPaperPlane} 
          isIconOnly 
          onClick={() => openPaymentModal(row)}
          disabled={row.balance <= 0}
        >
          Pagar Fornecedor
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Contas a Pagar</h1>
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

      {selectedSupplier && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`Pagar a ${selectedSupplier.supplier_name}`}
        >
          <SupplierPaymentForm supplier={selectedSupplier} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default ContasAPagar;
