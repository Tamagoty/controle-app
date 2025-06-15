// src/pages/Relatorios/RelatorioFinanceiro.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import StatCard from '../../components/StatCard/StatCard';
import { useNotify } from '../../hooks/useNotify';
import styles from './RelatorioFinanceiro.module.css';

const RelatorioFinanceiro = () => {
  const [reportData, setReportData] = useState({ summary: {}, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Primeiro dia do mês atual
    end: new Date().toISOString().split('T')[0], // Hoje
  });
  const notify = useNotify();

  // A CORREÇÃO ESTÁ AQUI: 'notify' foi removido das dependências do useCallback.
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_financial_report', {
        p_start_date: dates.start,
        p_end_date: dates.end,
      });
      if (error) throw error;
      setReportData(data || { summary: {}, transactions: [] });
    } catch (error) {
      notify.error(error.message || 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [dates]); // A dependência agora é apenas 'dates', que só muda com a interação do utilizador.

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDates(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const transactionColumns = [
    { header: 'Data', key: 'date', Cell: ({ row }) => new Date(row.date).toLocaleDateString() },
    { header: 'Tipo', key: 'type', Cell: ({ row }) => (
        <span className={row.type === 'Receita' ? styles.inflow : styles.outflow}>{row.type}</span>
    )},
    { header: 'Descrição', key: 'description', accessor: 'description'},
    { header: 'Valor', key: 'amount', Cell: ({ row }) => formatCurrency(row.amount)},
  ];
  
  const sortedTransactions = [...reportData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className={styles.header}>
        <h1>Relatório Financeiro</h1>
        <Card className={styles.filterContainer}>
            <div className={styles.dateFilter}>
                <label htmlFor="start-date">De:</label>
                <input type="date" id="start-date" name="start" value={dates.start} onChange={handleDateChange} />
            </div>
            <div className={styles.dateFilter}>
                <label htmlFor="end-date">Até:</label>
                <input type="date" id="end-date" name="end" value={dates.end} onChange={handleDateChange} />
            </div>
        </Card>
      </div>

      {loading ? <p>A gerar relatório...</p> : (
        <>
            <div className={styles.summaryGrid}>
                <StatCard title="Total de Entradas" value={formatCurrency(reportData.summary.total_inflow)} />
                <StatCard title="Total de Saídas" value={formatCurrency(reportData.summary.total_outflow)} />
                <StatCard 
                    title="Lucro Líquido" 
                    value={formatCurrency(reportData.summary.net_profit)} 
                />
            </div>

            <Card>
                <h2>Detalhe de Transações</h2>
                <Table columns={transactionColumns} data={sortedTransactions} />
            </Card>
        </>
      )}
    </div>
  );
};

export default RelatorioFinanceiro;
