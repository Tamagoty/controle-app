// src/pages/Financeiro/Comissoes.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaMoneyBillWave } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import CommissionPaymentForm from '../../components/CommissionPaymentForm/CommissionPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Pagination from '../../components/Pagination/Pagination';
import { useNotify } from '../../hooks/useNotify';

const ITEMS_PER_PAGE = 10;

const Comissoes = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_commission_summary');
      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar o resumo de comissões.');
    } finally {
      setLoading(false);
    }
  }, []); CORREÇÃO: // Removemos 'notify' das dependências para quebrar o loop.

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return summary.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, summary]);

  const handleSuccess = () => {
    fetchSummary();
    setIsModalOpen(false);
  };

  const openPaymentModal = (seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Vendedor', key: 'seller_name', accessor: 'seller_name' },
    { header: 'Status Pagamento de Comissão', key: 'balance', Cell: ({ row }) => <ProgressBar total={row.total_commission_due} paid={row.total_commission_paid} /> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => ( <Button icon={FaMoneyBillWave} isIconOnly onClick={() => openPaymentModal(row)}>Gerir Pagamentos</Button> ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Controlo de Comissões</h1>
      </div>
      
      <Card>
        {loading ? <p>A carregar resumo...</p> : (
          <>
            <Table columns={columns} data={currentTableData} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(summary.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
          </>
        )}
      </Card>

      {selectedSeller && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Gerir Comissões de ${selectedSeller.seller_name}`}>
          <CommissionPaymentForm seller={selectedSeller} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Comissoes;
