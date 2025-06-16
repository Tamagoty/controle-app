// src/pages/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import StatCard from '../components/StatCard/StatCard';
import SalesChart from '../components/SalesChart/SalesChart';
import RecentActivity from '../components/RecentActivity/RecentActivity';
import Card from '../components/Card/Card';
import styles from './Dashboard.module.css';
import { useNotify } from '../hooks/useNotify';
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    sales_over_time: [],
    recent_sales: []
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const notify = useNotify();
  const { user, loading: loadingAuth } = useAuth();

  const hasFetched = useRef(false); // <- controla se os dados já foram buscados

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingDashboard(true);
        const { data, error } = await supabase.rpc('get_full_dashboard_data');
        if (error) throw error;
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        notify.error('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoadingDashboard(false);
      }
    };

    if (!loadingAuth && user && !hasFetched.current) {
      hasFetched.current = true; // marca que já buscou
      fetchDashboardData();
    }
  }, [loadingAuth, user]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);

  const { summary, sales_over_time, recent_sales } = dashboardData;

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Dashboard</h1>
      {loadingAuth || loadingDashboard ? (
        <p>A carregar resumo...</p>
      ) : (
        <div className={styles.dashboardLayout}>
          <div className={styles.summaryGrid}>
            <StatCard title="Vendas este Mês" value={formatCurrency(summary.sales_total_month)} />
            <StatCard title="Compras este Mês" value={formatCurrency(summary.purchases_total_month)} />
            <StatCard title="Novos Clientes" value={summary.new_clients_month || 0} />
            <StatCard title="Saldo em Caixa" value={formatCurrency(summary.cash_balance)} />
            <StatCard title="Valor do Stock" value={formatCurrency(summary.total_stock_value)} />
          </div>

          <div className={styles.mainContentGrid}>
            <Card>
              <SalesChart data={sales_over_time} />
            </Card>
            <Card>
              <RecentActivity sales={recent_sales} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;