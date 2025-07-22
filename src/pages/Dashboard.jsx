// src/pages/Dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import StatCard from '../components/StatCard/StatCard';
import SalesChart from '../components/SalesChart/SalesChart';
import RecentActivity from '../components/RecentActivity/RecentActivity';
import Card from '../components/Card/Card';
import styles from './Dashboard.module.css';
import { useNotify } from '../hooks/useNotify';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState({ sales_over_time: [], recent_sales: [] });
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Chama a nova função para os cards
      const { data: mainData, error: mainError } = await supabase.rpc('get_main_dashboard_data');
      if (mainError) throw mainError;
      setDashboardData(mainData);

      // Mantém a chamada antiga apenas para os gráficos
      const { data: chartAndActivityData, error: chartError } = await supabase.rpc('get_full_dashboard_data');
      if (chartError) throw chartError;
      setChartData({
        sales_over_time: chartAndActivityData.sales_over_time || [],
        recent_sales: chartAndActivityData.recent_sales || []
      });

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      notify.error('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Dashboard</h1>
      {loading ? (
        <p>A carregar resumo...</p>
      ) : dashboardData && (
        <div className={styles.dashboardLayout}>
          
          <h2 className={styles.sectionTitle}>Resumo do Mês Atual</h2>
          <div className={styles.summaryGrid}>
            <StatCard title="Vendas no Mês" value={formatCurrency(dashboardData.monthly.total_sales)} type="revenue" />
            <StatCard title="Compras no Mês" value={formatCurrency(dashboardData.monthly.total_purchases)} type="expense" />
            <StatCard title="Despesas no Mês" value={formatCurrency(dashboardData.monthly.total_expenses)} type="expense" />
            <StatCard title="Saldo do Mês" value={formatCurrency(dashboardData.monthly.balance)} type="balance" />
          </div>

          <h2 className={styles.sectionTitle}>Resumo Geral</h2>
          <div className={styles.summaryGrid}>
            <StatCard title="Total de Vendas" value={formatCurrency(dashboardData.overall.total_sales)} type="revenue" />
            <StatCard title="Total de Compras" value={formatCurrency(dashboardData.overall.total_purchases)} type="expense" />
            <StatCard title="Total de Despesas" value={formatCurrency(dashboardData.overall.total_expenses)} type="expense" />
            <StatCard title="Balanço Geral" value={formatCurrency(dashboardData.overall.balance)} type="balance" />
          </div>

          <div className={styles.mainContentGrid}>
            <Card>
              <SalesChart data={chartData.sales_over_time} />
            </Card>
            <Card>
              <RecentActivity sales={chartData.recent_sales} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
