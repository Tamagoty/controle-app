// src/pages/Vendas.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import SaleForm from '../components/SaleForm/SaleForm';
import SalePaymentForm from '../components/SalePaymentForm/SalePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination';
import { useNotify } from '../hooks/useNotify';

const ITEMS_PER_PAGE = 10;

const Vendas = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const notify = useNotify();

  // A CORREÇÃO ESTÁ AQUI: 'notify' foi removido das dependências do useCallback.
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_sales_with_payment_status');
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as vendas.');
    } finally {
      setLoading(false);
    }
  }, []); // A dependência do 'notify' foi removida para quebrar o loop.

  // O useEffect agora chama a função que está no escopo do componente.
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Esta função agora consegue aceder a fetchSales corretamente.
  const handleSuccess = () => {
    fetchSales();
    setIsSaleModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };
  
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return sales.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sales]);

  const columns = [
    {
      header: 'Cliente / Vendedor',
      key: 'client_name',
      Cell: ({ row }) => (
        <div>
          <strong>{row.client_name}</strong>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {row.seller_name || 'Sem Vendedor'}
          </div>
        </div>
      )
    },
    {
      header: 'Data / C. Custo',
      key: 'sale_date',
      Cell: ({ row }) => (
        <div>
          <strong>{new Date(row.sale_date).toLocaleDateString()}</strong>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {row.cost_center_name || 'Não informado'}
          </div>
        </div>
      )
    },
    { 
      header: 'Status Pagamento',
      key: 'balance',
      Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} />
    },
    { 
      header: 'Ações',
      key: 'actions',
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
        <h1>Vendas</h1>
        <Button icon={FaPlus} onClick={() => setIsSaleModalOpen(true)}>
          Nova Venda
        </Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar vendas...</p>
        ) : (
          <>
            <Table columns={columns} data={currentTableData} />
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(sales.length / ITEMS_PER_PAGE)}
              onPageChange={page => setCurrentPage(page)}
            />
          </>
        )}
      </Card>

      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registar Nova Venda">
        <SaleForm onSuccess={handleSuccess} />
      </Modal>

      {selectedSale && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Detalhes do Pagamento">
          <SalePaymentForm sale={selectedSale} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Vendas;
