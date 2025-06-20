// src/pages/Capital/TransacoesSocios.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaTrash } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import PartnerTransactionForm from '../../components/PartnerTransactionForm/PartnerTransactionForm';
import Pagination from '../../components/Pagination/Pagination';
import { useNotify } from '../../hooks/useNotify';
import styles from './TransacoesSocios.module.css';

const ITEMS_PER_PAGE = 10;

const TransacoesSocios = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_partner_transactions');
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as transações.');
    } finally {
      setLoading(false);
    }
  }, []); //CORREÇÃO: Removemos 'notify' das dependências para quebrar o loop.

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return transactions.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, transactions]);

  const handleDelete = async (id) => {
    if (window.confirm('Tem a certeza que quer apagar esta transação?')) {
        try {
            await supabase.from('partner_transactions').delete().eq('id', id);
            notify.success('Transação apagada.');
            fetchTransactions();
        } catch (error) {
            notify.error('Falha ao apagar.');
        }
    }
  }

  const handleSuccess = () => {
    fetchTransactions();
    setIsModalOpen(false);
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const columns = [
    { header: 'Data', key: 'transaction_date', Cell: ({ row }) => new Date(row.transaction_date).toLocaleDateString() },
    { header: 'Sócio', key: 'partner_name', accessor: 'partner_name' },
    { header: 'Tipo', key: 'transaction_type', Cell: ({ row }) => ( <span className={row.transaction_type === 'Aporte' ? styles.inflow : styles.outflow}> {row.transaction_type} </span> )},
    { header: 'Descrição', key: 'description', accessor: 'description' },
    { header: 'Valor', key: 'amount', Cell: ({ row }) => formatCurrency(row.amount) },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => <Button icon={FaTrash} variant="danger" isIconOnly onClick={() => handleDelete(row.id)}>Apagar</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Aportes & Retiradas</h1>
        <Button icon={FaPlus} onClick={() => setIsModalOpen(true)}>Nova Transação</Button>
      </div>
      
      <Card>
        {loading ? <p>A carregar...</p> : (
            <>
                <Table columns={columns} data={currentTableData} />
                <Pagination currentPage={currentPage} totalPages={Math.ceil(transactions.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
            </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registar Nova Transação de Sócio">
        <PartnerTransactionForm onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default TransacoesSocios;
