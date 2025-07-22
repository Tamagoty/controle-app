// src/pages/Financeiro/ContasAReceber.jsx

import React, { useState, useMemo } from 'react';
import { FaHandHoldingUsd } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ClientPaymentForm from '../../components/ClientPaymentForm/ClientPaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Pagination from '../../components/Pagination/Pagination'; // Importar Paginação
import { useContasAReceber } from '../../hooks/useContasAReceber';
import styles from './ContasAReceber.module.css'; // Usaremos um CSS dedicado

const ITEMS_PER_PAGE = 10;

const ContasAReceber = () => {
  const { summary, loading, fetchSummary } = useContasAReceber();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- NOVOS ESTADOS PARA OS FILTROS ---
  const [filterClientName, setFilterClientName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  // --- LÓGICA DE FILTRAGEM ---
  const filteredSummary = useMemo(() => {
    return summary
      .filter(client =>
        filterClientName ? client.client_name.toLowerCase().includes(filterClientName.toLowerCase()) : true
      )
      .filter(client => {
        if (!filterPaymentStatus) return true;
        // A RPC já garante que balance > 0
        if (filterPaymentStatus === 'parcial') return client.total_paid > 0;
        if (filterPaymentStatus === 'nao_pago') return client.total_paid === 0;
        return true;
      });
  }, [summary, filterClientName, filterPaymentStatus]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredSummary.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredSummary]);

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
      <div className={styles.header}>
        <h1>Contas a Receber</h1>
      </div>

      {/* --- NOVO CARD DE FILTROS --- */}
      <Card className={styles.filterCard}>
        <input 
          type="text"
          placeholder="Buscar por cliente..."
          value={filterClientName}
          onChange={(e) => setFilterClientName(e.target.value)}
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
