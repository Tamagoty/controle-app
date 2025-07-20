// src/pages/Relatorios/RelatorioFinanceiro.jsx

import React, { useState, useEffect } from 'react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import StatCard from '../../components/StatCard/StatCard';
import { useRelatorioFinanceiro } from '../../hooks/useRelatorioFinanceiro'; // <-- NOSSO NOVO HOOK!
import styles from './RelatorioFinanceiro.module.css';

const RelatorioFinanceiro = () => {
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // --- LÓGICA DE DADOS DO HOOK ---
  const { reportData, loading, fetchReport } = useRelatorioFinanceiro(dates);

  // Efeito para buscar novos dados quando as datas mudam
  useEffect(() => {
    fetchReport(dates);
  }, [dates, fetchReport]);

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
  
  const sortedTransactions = [...(reportData.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

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
