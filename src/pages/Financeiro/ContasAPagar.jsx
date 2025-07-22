// src/pages/Financeiro/ContasAPagar.jsx

import React, { useState, useMemo } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import SupplierPaymentForm from '../../components/SupplierPaymentForm/SupplierPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Pagination from '../../components/Pagination/Pagination'; // Importar Paginação
import { useContasAPagar } from '../../hooks/useContasAPagar';
import styles from './ContasAPagar.module.css'; // Usaremos um CSS dedicado

const ITEMS_PER_PAGE = 10;

const ContasAPagar = () => {
  const { summary, loading, fetchSummary } = useContasAPagar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- NOVOS ESTADOS PARA OS FILTROS ---
  const [filterSupplierName, setFilterSupplierName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  // --- LÓGICA DE FILTRAGEM ---
  const filteredSummary = useMemo(() => {
    return summary
      .filter(supplier =>
        filterSupplierName ? supplier.supplier_name.toLowerCase().includes(filterSupplierName.toLowerCase()) : true
      )
      .filter(supplier => {
        if (!filterPaymentStatus) return true;
        // A RPC já garante que balance > 0
        if (filterPaymentStatus === 'parcial') return supplier.total_paid > 0;
        if (filterPaymentStatus === 'nao_pago') return supplier.total_paid === 0;
        return true;
      });
  }, [summary, filterSupplierName, filterPaymentStatus]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredSummary.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredSummary]);

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
      <div className={styles.header}>
        <h1>Contas a Pagar</h1>
      </div>

      {/* --- NOVO CARD DE FILTROS --- */}
      <Card className={styles.filterCard}>
        <input 
          type="text"
          placeholder="Buscar por fornecedor..."
          value={filterSupplierName}
          onChange={(e) => setFilterSupplierName(e.target.value)}
          className={styles.filterInput}
        />
        <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className={styles.filterInput}>
          <option value="">Todos os Status</option>
          <option value="parcial">Parcialmente Pago</option>
          <option value="nao_pago">Não Pago</option>
        </select>
      </Card>
      
      <Card>
        {loading ? (
          <p>A carregar resumo...</p>
        ) : (
          <>
            <Table 
              columns={columns} 
              data={currentTableData}
            />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredSummary.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
          </>
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
