// src/pages/Financeiro/DespesasGerais.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ExpenseForm from '../../components/ExpenseForm/ExpenseForm';
import ExpensePaymentForm from '../../components/ExpensePaymentForm/ExpensePaymentForm';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { useNotify } from '../../hooks/useNotify';

const DespesasGerais = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const notify = useNotify();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_expenses_with_payment_status');
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      notify.error(error.message || 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

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
    {
      header: 'Descrição / Categoria',
      key: 'description',
      Cell: ({ row }) => (
        <div>
          <strong>{row.description}</strong>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {row.category_name} {row.employee_name && `(${row.employee_name})`}
          </div>
        </div>
      )
    },
    {
      header: 'Data / C. Custo',
      key: 'expense_date',
      Cell: ({ row }) => (
        <div>
            <strong>{new Date(row.expense_date).toLocaleDateString()}</strong>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {row.cost_center_name}
            </div>
        </div>
      )
    },
    {
      header: 'Status Pagamento',
      key: 'balance',
      Cell: ({ row }) => <ProgressBar total={row.amount} paid={row.total_paid} />
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => (
        <Button icon={FaMoneyBillWave} isIconOnly onClick={() => openPaymentModal(row)}>
            Pagar
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Despesas Gerais</h1>
        <Button icon={FaPlus} onClick={() => setIsExpenseModalOpen(true)}>
          Nova Despesa
        </Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar despesas...</p>
        ) : (
          <Table 
            columns={columns} 
            data={expenses}
          />
        )}
      </Card>

      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title="Registar Nova Despesa Geral"
      >
        <ExpenseForm onSuccess={handleSuccess} />
      </Modal>

      {selectedExpense && (
        <Modal 
            isOpen={isPaymentModalOpen} 
            onClose={() => setIsPaymentModalOpen(false)} 
            title="Detalhes do Pagamento da Despesa"
        >
          <ExpensePaymentForm expense={selectedExpense} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default DespesasGerais;
