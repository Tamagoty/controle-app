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
import styles from './Vendas.module.css';

const ITEMS_PER_PAGE = 10;

const Vendas = () => {
  // --- ESTADOS DO COMPONENTE ---
  const [sales, setSales] = useState([]); // Guarda a lista COMPLETA de vendas
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const notify = useNotify();

  // --- ESTADOS PARA OS FILTROS (ATUALIZADOS) ---
  const [filterClientName, setFilterClientName] = useState('');
  const [filterCostCenterName, setFilterCostCenterName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  // --- LÓGICA DE DADOS ---
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
  }, []); // CORREÇÃO: Removido 'notify' das dependências para quebrar o loop.

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // LÓGICA DE FILTRAGEM ATUALIZADA
  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => 
        filterClientName ? sale.client_name.toLowerCase().includes(filterClientName.toLowerCase()) : true
      )
      .filter(sale => 
        filterCostCenterName ? sale.cost_center_name.toLowerCase().includes(filterCostCenterName.toLowerCase()) : true
      )
      .filter(sale => {
        if (!filterPaymentStatus) return true;
        const balance = sale.balance;
        if (filterPaymentStatus === 'pago') return balance <= 0;
        if (filterPaymentStatus === 'parcial') return balance > 0 && sale.total_paid > 0;
        if (filterPaymentStatus === 'nao_pago') return sale.total_paid === 0;
        return true;
      });
  }, [sales, filterClientName, filterCostCenterName, filterPaymentStatus]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredSales.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredSales]);
  
  // --- MANIPULADORES DE EVENTOS ---
  const handleSuccess = () => {
    fetchSales();
    setIsSaleModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  const columns = [
    { header: 'Cliente / Vendedor', key: 'client_name', Cell: ({ row }) => (<div><strong>{row.client_name}</strong><div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.seller_name || 'Sem Vendedor'}</div></div>) },
    { header: 'Data / C. Custo', key: 'sale_date', Cell: ({ row }) => (<div><strong>{new Date(row.sale_date).toLocaleDateString()}</strong><div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.cost_center_name || 'Não informado'}</div></div>) },
    { header: 'Status Pagamento', key: 'balance', Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} /> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => (<Button icon={FaMoneyBillWave} onClick={() => openPaymentModal(row)} isIconOnly>Ver Pagamentos</Button>) },
  ];

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div>
      <div className={styles.header}>
        <h1>Vendas</h1>
        <Button icon={FaPlus} onClick={() => setIsSaleModalOpen(true)}>Nova Venda</Button>
      </div>
      
      {/* FILTROS ATUALIZADOS */}
      <Card className={styles.filterCard}>
        <input 
          type="text"
          placeholder="Buscar por cliente..."
          value={filterClientName}
          onChange={(e) => setFilterClientName(e.target.value)}
          className={styles.filterInput}
        />
        <input 
          type="text"
          placeholder="Buscar por centro de custo..."
          value={filterCostCenterName}
          onChange={(e) => setFilterCostCenterName(e.target.value)}
          className={styles.filterInput}
        />
        <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className={styles.filterInput}>
          <option value="">Todos os Status</option>
          <option value="pago">Pago</option>
          <option value="parcial">Parcial</option>
          <option value="nao_pago">Não Pago</option>
        </select>
      </Card>

      <Card>
        {loading ? <p>A carregar vendas...</p> : (
          <>
            <Table columns={columns} data={currentTableData} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredSales.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
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
