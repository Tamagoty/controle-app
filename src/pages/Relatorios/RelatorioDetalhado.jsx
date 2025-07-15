// src/pages/Relatorios/RelatorioDetalhado.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/Card/Card';
import { useNotify } from '../../hooks/useNotify';
import styles from './RelatorioDetalhado.module.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d'];

const RelatorioDetalhado = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [filterCostCenter, setFilterCostCenter] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const notify = useNotify();

  // CORREÇÃO: A função para buscar os dados agora depende apenas das 'datas'.
  // O 'notify' foi removido das dependências para quebrar o loop infinito.
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_transactions_for_report', {
        p_start_date: dates.start,
        p_end_date: dates.end,
      });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [dates]); // A dependência do 'notify' foi removida.

  // O useEffect agora depende da função 'fetchTransactions', que é estável
  // e só muda quando as datas são alteradas pelo utilizador.
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Lógica para filtrar e agrupar os dados no frontend
  const processedData = useMemo(() => {
    const filtered = transactions
      .filter(t => filterCostCenter ? t.cost_center_id === parseInt(filterCostCenter) : true)
      .filter(t => filterEntity ? t.entity_id === filterEntity : true);

    const groupedByCostCenter = filtered.reduce((acc, t) => {
      const ccId = t.cost_center_id;
      if (!acc[ccId]) {
        acc[ccId] = {
          name: t.cost_center_name,
          sales: [],
          purchases: [],
          expenses: [],
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
        };
      }
      if (t.transaction_type === 'Receita de Venda') {
        acc[ccId].sales.push(t);
        acc[ccId].totalSales += t.amount;
      } else if (t.transaction_type === 'Despesa de Compra') {
        acc[ccId].purchases.push(t);
        acc[ccId].totalPurchases += t.amount;
      } else {
        acc[ccId].expenses.push(t);
        acc[ccId].totalExpenses += t.amount;
      }
      return acc;
    }, {});

    return Object.values(groupedByCostCenter);
  }, [transactions, filterCostCenter, filterEntity]);
  
  // Prepara os dados para os dropdowns de filtro
  const costCenterOptions = useMemo(() => [...new Map(transactions.map(item => [item['cost_center_id'], item])).values()], [transactions]);
  const entityOptions = useMemo(() => [...new Map(transactions.map(item => [item['entity_id'], item])).values()].filter(e => e.entity_id), [transactions]);
  
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div>
      <div className={styles.header}>
        <h1>Relatório Detalhado</h1>
        <Card className={styles.filterContainer}>
          <input type="date" name="start" value={dates.start} onChange={e => setDates(p => ({...p, start: e.target.value}))} />
          <input type="date" name="end" value={dates.end} onChange={e => setDates(p => ({...p, end: e.target.value}))} />
          <select value={filterCostCenter} onChange={e => setFilterCostCenter(e.target.value)}>
            <option value="">Todos os Centros de Custo</option>
            {costCenterOptions.map(cc => <option key={cc.cost_center_id} value={cc.cost_center_id}>{cc.cost_center_name}</option>)}
          </select>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
            <option value="">Todas as Pessoas/Empresas</option>
            {entityOptions.map(e => <option key={e.entity_id} value={e.entity_id}>{e.entity_name}</option>)}
          </select>
        </Card>
      </div>

      {loading ? <p>A gerar relatório...</p> : (
        <div className={styles.reportContainer}>
          {processedData.map(cc => (
            <Card key={cc.name} className={styles.costCenterCard}>
              <h2 className={styles.costCenterTitle}>{cc.name}</h2>
              <div className={styles.costCenterGrid}>
                <div className={styles.transactionsSection}>
                  {/* Vendas */}
                  <h4>Vendas ({formatCurrency(cc.totalSales)})</h4>
                  <ul className={styles.transactionList}>
                    {cc.sales.map((t, i) => <li key={i}><span>{t.description}</span><span>{formatCurrency(t.amount)}</span></li>)}
                  </ul>
                  {/* Compras */}
                  <h4>Compras ({formatCurrency(cc.totalPurchases)})</h4>
                  <ul className={styles.transactionList}>
                    {cc.purchases.map((t, i) => <li key={i}><span>{t.description}</span><span>{formatCurrency(t.amount)}</span></li>)}
                  </ul>
                  {/* Despesas */}
                  <h4>Outras Despesas ({formatCurrency(cc.totalExpenses)})</h4>
                  <ul className={styles.transactionList}>
                    {cc.expenses.map((t, i) => <li key={i}><span>{t.description}</span><span>{formatCurrency(t.amount)}</span></li>)}
                  </ul>
                </div>
                <div className={styles.chartSection}>
                  <h4>Despesas por Categoria</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={cc.expenses.reduce((acc, t) => {
                          const existing = acc.find(i => i.name === t.category_name);
                          if (existing) existing.value += t.amount;
                          else acc.push({ name: t.category_name, value: t.amount });
                          return acc;
                        }, [])} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                        {cc.expenses.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatorioDetalhado;
