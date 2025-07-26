// src/pages/Vendas.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import SaleForm from '../components/SaleForm/SaleForm';
import SalePaymentForm from '../components/SalePaymentForm/SalePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination';
import TableSkeleton from '../components/TableSkeleton/TableSkeleton'; // <-- NOVO
import { useVendas } from '../hooks/useVendas';
import { useNotify } from '../hooks/useNotify';
import styles from './Vendas.module.css';

const ITEMS_PER_PAGE = 10;

const Vendas = () => {
  const { vendas, loading, fetchVendas } = useVendas();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const notify = useNotify();
  
  // Estados para os filtros
  const [filters, setFilters] = useState({
    clientName: '',
    costCenterName: '',
    paymentStatus: ''
  });

  // Efeito que chama a busca com filtros sempre que eles mudam
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVendas(filters);
    }, 500); // Debounce de 500ms para evitar chamadas excessivas ao digitar

    return () => {
      clearTimeout(handler);
    };
  }, [filters, fetchVendas]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reseta para a primeira página ao aplicar um filtro
  };

  // A filtragem no lado do cliente foi removida. 'vendas' já vem filtrado.
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return vendas.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, vendas]);
  
  const handleSuccess = () => {
    fetchVendas(filters); // Recarrega os dados com os filtros atuais
    setIsSaleModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteClick = (saleId) => {
    setSaleToDelete(saleId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_sale', { p_sale_id: saleToDelete });
      if (error) throw error;
      notify.success('Venda apagada com sucesso!');
      fetchVendas(filters); // Recarrega os dados com os filtros atuais
    } catch (err) {
      notify.error(err.message || 'Não foi possível apagar a venda.');
    } finally {
      setIsConfirmModalOpen(false);
      setSaleToDelete(null);
    }
  };

  const columns = [
    { header: 'Cliente / Vendedor', key: 'client_name', Cell: ({ row }) => (<div><strong>{row.client_name}</strong><div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.seller_name || 'Sem Vendedor'}</div></div>) },
    { header: 'Data / C. Custo', key: 'sale_date', Cell: ({ row }) => (<div><strong>{new Date(row.sale_date).toLocaleDateString()}</strong><div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.cost_center_name || 'Não informado'}</div></div>) },
    { header: 'Status Pagamento', key: 'balance', Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} /> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => (
      <div className={styles.actionsCell}>
        <Button icon={FaMoneyBillWave} onClick={() => openPaymentModal(row)} isIconOnly>Ver Pagamentos</Button>
        <Button icon={FaTrash} variant="danger" onClick={() => handleDeleteClick(row.id)} isIconOnly>Apagar Venda</Button>
      </div>
    )},
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1>Vendas</h1>
        <Button icon={FaPlus} onClick={() => setIsSaleModalOpen(true)}>Nova Venda</Button>
      </div>
      
      <Card className={styles.filterCard}>
        <input 
          type="text"
          name="clientName"
          placeholder="Buscar por cliente..."
          value={filters.clientName}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <input 
          type="text"
          name="costCenterName"
          placeholder="Buscar por centro de custo..."
          value={filters.costCenterName}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <select name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className={styles.filterInput}>
          <option value="">Todos os Status</option>
          <option value="pago">Pago</option>
          <option value="parcial">Parcial</option>
          <option value="nao_pago">Não Pago</option>
        </select>
      </Card>

      <Card>
        {loading ? <TableSkeleton rows={5} columns={4} /> : (
          <>
            <Table columns={columns} data={currentTableData} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(vendas.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
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

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar esta venda? Todas as comissões e pagamentos associados serão removidos e o stock será devolvido. Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Apagar Venda</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vendas;
