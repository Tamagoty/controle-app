// src/pages/Financeiro/DespesasGerais.jsx

import React, { useState, useMemo } from 'react';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ExpenseForm from '../../components/ExpenseForm/ExpenseForm';
import ExpensePaymentForm from '../../components/ExpensePaymentForm/ExpensePaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Pagination from '../../components/Pagination/Pagination';
import { useDespesas } from '../../hooks/useDespesas'; // <-- NOSSO NOVO HOOK!

const ITEMS_PER_PAGE = 10;

const DespesasGerais = () => {
  // --- LÓGICA DE DADOS DO HOOK ---
  const { expenses, loading, fetchExpenses } = useDespesas();

  // --- ESTADOS LOCAIS DO COMPONENTE (UI) ---
  const [sortConfig, setSortConfig] = useState({ key: 'expense_date', direction: 'descending' });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedExpenses = useMemo(() => {
    let sortableItems = [...expenses];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [expenses, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return sortedExpenses.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedExpenses]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSuccess = () => {
    fetchExpenses();
    setIsExpenseModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (expense) => {
    setSelectedExpense(expense);
    setIsPaymentModalOpen(true);
  };

  const columns = [
    { header: 'Descrição / Categoria', key: 'description', sortable: true, Cell: ({ row }) => ( <div> <strong>{row.description}</strong> <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> {row.category_name} {row.employee_name && `(${row.employee_name})`} </div> </div> ) },
    { header: 'Data / C. Custo', key: 'expense_date', sortable: true, Cell: ({ row }) => ( <div> <strong>{new Date(row.expense_date).toLocaleDateString()}</strong> <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> {row.cost_center_name} </div> </div> ) },
    { header: 'Status Pagamento', key: 'balance', sortable: true, Cell: ({ row }) => <ProgressBar total={row.amount} paid={row.total_paid} /> },
    { header: 'Ações', key: 'actions', sortable: false, Cell: ({ row }) => ( <Button icon={FaMoneyBillWave} isIconOnly onClick={() => openPaymentModal(row)}> Pagar </Button> ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Despesas Gerais</h1>
        <Button icon={FaPlus} onClick={() => setIsExpenseModalOpen(true)}>Nova Despesa</Button>
      </div>
      
      <Card>
        {loading ? <p>A carregar despesas...</p> : (
          <>
            <Table columns={columns} data={currentTableData} onSort={requestSort} sortConfig={sortConfig} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
          </>
        )}
      </Card>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Registar Nova Despesa Geral">
        <ExpenseForm onSuccess={handleSuccess} />
      </Modal>

      {selectedExpense && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Detalhes do Pagamento da Despesa">
          <ExpensePaymentForm expense={selectedExpense} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default DespesasGerais;
