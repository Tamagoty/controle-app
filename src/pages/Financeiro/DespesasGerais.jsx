// src/pages/Financeiro/DespesasGerais.jsx

import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ExpenseForm from '../../components/ExpenseForm/ExpenseForm';
import ExpensePaymentForm from '../../components/ExpensePaymentForm/ExpensePaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Pagination from '../../components/Pagination/Pagination';
import { useDespesas } from '../../hooks/useDespesas';
import { useNotify } from '../../hooks/useNotify';
import styles from './DespesasGerais.module.css'; // Crie este ficheiro CSS

const ITEMS_PER_PAGE = 10;

const DespesasGerais = () => {
  const { expenses, loading, fetchExpenses } = useDespesas();
  const [sortConfig, setSortConfig] = useState({ key: 'expense_date', direction: 'descending' });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  // --- NOVOS ESTADOS PARA OS FILTROS ---
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense =>
        filterSearchTerm
          ? expense.description.toLowerCase().includes(filterSearchTerm.toLowerCase()) ||
            expense.category_name.toLowerCase().includes(filterSearchTerm.toLowerCase())
          : true
      )
      .filter(expense => {
        if (!filterPaymentStatus) return true;
        const balance = expense.balance;
        if (filterPaymentStatus === 'pago') return balance <= 0;
        if (filterPaymentStatus === 'parcial') return balance > 0 && expense.total_paid > 0;
        if (filterPaymentStatus === 'nao_pago') return expense.total_paid === 0;
        return true;
      });
  }, [expenses, filterSearchTerm, filterPaymentStatus]);

  const sortedExpenses = useMemo(() => {
    let sortableItems = [...filteredExpenses];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredExpenses, sortConfig]);

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

  // --- NOVA LÓGICA PARA APAGAR ---
  const handleDeleteClick = (expenseId) => {
    setExpenseToDelete(expenseId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_expense', { p_expense_id: expenseToDelete });
      if (error) throw error;
      notify.success('Despesa apagada com sucesso!');
      fetchExpenses();
    } catch (err) {
      notify.error(err.message || 'Não foi possível apagar a despesa.');
    } finally {
      setIsConfirmModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  const columns = [
    { header: 'Descrição / Categoria', key: 'description', sortable: true, Cell: ({ row }) => ( <div> <strong>{row.description}</strong> <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> {row.category_name} {row.employee_name && `(${row.employee_name})`} </div> </div> ) },
    { header: 'Data / C. Custo', key: 'expense_date', sortable: true, Cell: ({ row }) => ( <div> <strong>{new Date(row.expense_date).toLocaleDateString()}</strong> <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> {row.cost_center_name} </div> </div> ) },
    { header: 'Status Pagamento', key: 'balance', sortable: true, Cell: ({ row }) => <ProgressBar total={row.amount} paid={row.total_paid} /> },
    { header: 'Ações', key: 'actions', sortable: false, Cell: ({ row }) => (
      <div className={styles.actionsCell}>
        <Button icon={FaMoneyBillWave} isIconOnly onClick={() => openPaymentModal(row)}> Pagar </Button>
        <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDeleteClick(row.id)}>Apagar</Button>
      </div>
    )},
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1>Despesas Gerais</h1>
        <Button icon={FaPlus} onClick={() => setIsExpenseModalOpen(true)}>Nova Despesa</Button>
      </div>

      {/* --- NOVO CARD DE FILTROS --- */}
      <Card className={styles.filterCard}>
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria..."
          value={filterSearchTerm}
          onChange={(e) => setFilterSearchTerm(e.target.value)}
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

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Exclusão">
        <div>
          <p>Tem a certeza que quer apagar esta despesa? Todos os pagamentos e anexos associados serão removidos. Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Apagar Despesa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DespesasGerais;
