// src/pages/Compras.jsx

import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa'; // Adicionado FaTrash
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import PurchaseForm from '../components/PurchaseForm/PurchaseForm';
import PurchasePaymentForm from '../components/PurchasePaymentForm/PurchasePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination';
import { useCompras } from '../hooks/useCompras';
import { useNotify } from '../hooks/useNotify'; // Importar useNotify
import styles from './Compras.module.css';

const ITEMS_PER_PAGE = 10;

const Compras = () => {
  const { compras, loading, fetchCompras } = useCompras();
  const [sortConfig, setSortConfig] = useState({ key: 'purchase_date', direction: 'descending' });
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Modal de confirmação
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null); // ID da compra a apagar
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const [filterSupplierName, setFilterSupplierName] = useState('');
  const [filterCostCenterName, setFilterCostCenterName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  const filteredPurchases = useMemo(() => {
    return compras
      .filter(purchase => 
        filterSupplierName ? purchase.supplier_name.toLowerCase().includes(filterSupplierName.toLowerCase()) : true
      )
      .filter(purchase => 
        filterCostCenterName ? purchase.cost_center_name.toLowerCase().includes(filterCostCenterName.toLowerCase()) : true
      )
      .filter(purchase => {
        if (!filterPaymentStatus) return true;
        const balance = purchase.balance;
        if (filterPaymentStatus === 'pago') return balance <= 0;
        if (filterPaymentStatus === 'parcial') return balance > 0 && purchase.total_paid > 0;
        if (filterPaymentStatus === 'nao_pago') return purchase.total_paid === 0;
        return true;
      });
  }, [compras, filterSupplierName, filterCostCenterName, filterPaymentStatus]);

  const sortedPurchases = useMemo(() => {
    let sortableItems = [...filteredPurchases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPurchases, sortConfig]);

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
    fetchCompras();
    setIsPurchaseModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  // --- NOVA LÓGICA PARA APAGAR ---
  const handleDeleteClick = (purchaseId) => {
    setPurchaseToDelete(purchaseId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!purchaseToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_purchase', { p_purchase_id: purchaseToDelete });
      if (error) throw error;
      notify.success('Compra apagada com sucesso!');
      fetchCompras();
    } catch (err) {
      notify.error(err.message || 'Não foi possível apagar a compra.');
    } finally {
      setIsConfirmModalOpen(false);
      setPurchaseToDelete(null);
    }
  };

  const columns = [
    { header: 'Fornecedor / C. Custo', key: 'supplier_name', sortable: true, Cell: ({ row }) => (<div><strong>{row.supplier_name}</strong><div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.cost_center_name || 'Não informado'}</div></div>) },
    { header: 'Data', key: 'purchase_date', sortable: true, Cell: ({ row }) => new Date(row.purchase_date).toLocaleDateString() },
    { header: 'Status Pagamento', key: 'balance', sortable: true, Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} /> },
    { header: 'Ações', key: 'actions', sortable: false, Cell: ({ row }) => (
      <div className={styles.actionsCell}>
        <Button icon={FaMoneyBillWave} onClick={() => openPaymentModal(row)} isIconOnly>Ver Pagamentos</Button>
        <Button icon={FaTrash} variant="danger" onClick={() => handleDeleteClick(row.id)} isIconOnly>Apagar Compra</Button>
      </div>
    )},
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1>Compras</h1>
        <Button icon={FaPlus} onClick={() => setIsPurchaseModalOpen(true)}>Nova Compra</Button>
      </div>
      
      <Card className={styles.filterCard}>
        <input 
          type="text"
          placeholder="Buscar por fornecedor..."
          value={filterSupplierName}
          onChange={(e) => setFilterSupplierName(e.target.value)}
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
        {loading ? <p>A carregar compras...</p> : (
          <>
            <Table columns={columns} data={currentTableData} onSort={requestSort} sortConfig={sortConfig} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
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

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar esta compra? Todos os pagamentos associados serão removidos e o stock será revertido. Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Apagar Compra</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Compras;
