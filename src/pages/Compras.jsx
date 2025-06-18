// src/pages/Compras.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import PurchaseForm from '../components/PurchaseForm/PurchaseForm';
import PurchasePaymentForm from '../components/PurchasePaymentForm/PurchasePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination';
import { useNotify } from '../hooks/useNotify';

const ITEMS_PER_PAGE = 10;

const Compras = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'purchase_date', direction: 'descending' });
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const notify = useNotify();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_purchases_with_payment_status');
      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as compras.');
    } finally {
      setLoading(false);
    }
    // CORREÇÃO: Removemos 'notify' das dependências para quebrar o loop.
    // O useCallback agora garante que a função não seja recriada desnecessariamente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const sortedPurchases = useMemo(() => {
    let sortableItems = [...purchases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [purchases, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return sortedPurchases.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedPurchases]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSuccess = () => {
    fetchPurchases();
    setIsPurchaseModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  const columns = [
    {
      header: 'Fornecedor / C. Custo',
      key: 'supplier_name',
      sortable: true,
      Cell: ({ row }) => (
        <div>
          <strong>{row.supplier_name}</strong>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {row.cost_center_name || 'Não informado'}
          </div>
        </div>
      )
    },
    {
      header: 'Data',
      key: 'purchase_date',
      sortable: true,
      Cell: ({ row }) => new Date(row.purchase_date).toLocaleDateString()
    },
    { 
      header: 'Status Pagamento',
      key: 'balance',
      sortable: true,
      Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} />
    },
    {
      header: 'Ações',
      key: 'actions',
      sortable: false,
      Cell: ({ row }) => (
        <Button 
          icon={FaMoneyBillWave}
          onClick={() => openPaymentModal(row)}
          isIconOnly
        >
          Ver Pagamentos
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Compras</h1>
        <Button icon={FaPlus} onClick={() => setIsPurchaseModalOpen(true)}>Nova Compra</Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar compras...</p>
        ) : (
          <>
            <Table 
              columns={columns} 
              data={currentTableData}
              onSort={requestSort}
              sortConfig={sortConfig}
            />
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE)}
              onPageChange={page => setCurrentPage(page)}
            />
          </>
        )}
      </Card>

      <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Registar Nova Compra">
        <PurchaseForm onSuccess={handleSuccess} />
      </Modal>

      {selectedPurchase && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Detalhes do Pagamento da Compra">
          <PurchasePaymentForm purchase={selectedPurchase} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Compras;
