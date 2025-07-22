// src/pages/Vendas.jsx

import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa'; // Adicionado FaTrash
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import SaleForm from '../components/SaleForm/SaleForm';
import SalePaymentForm from '../components/SalePaymentForm/SalePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination';
import { useVendas } from '../hooks/useVendas';
import { useNotify } from '../hooks/useNotify'; // Importar useNotify
import styles from './Vendas.module.css';

const ITEMS_PER_PAGE = 10;

const Vendas = () => {
  const { vendas, loading, fetchVendas } = useVendas();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Modal de confirmação
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null); // ID da venda a apagar
  const notify = useNotify();
  
  const [filterClientName, setFilterClientName] = useState('');
  const [filterCostCenterName, setFilterCostCenterName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  const filteredSales = useMemo(() => {
    return vendas
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
  }, [vendas, filterClientName, filterCostCenterName, filterPaymentStatus]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredSales.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredSales]);
  
  const handleSuccess = () => {
    fetchVendas();
    setIsSaleModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  // --- NOVA LÓGICA PARA APAGAR ---
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
      fetchVendas();
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
