// src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import StatCard from '../components/StatCard/StatCard';
import styles from './Dashboard.module.css';
import { useNotify } from '../hooks/useNotify';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_dashboard_summary');
        
        if (error) {
          throw error;
        }

        setSummary(data);
      } catch (error) {
        console.error('Erro ao buscar resumo do dashboard:', error);
        notify.error('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Dashboard</h1>
      {loading ? (
        <p>A carregar resumo...</p>
      ) : (
        <div className={styles.statsGrid}>
          <StatCard 
            title="Vendas este Mês" 
            value={formatCurrency(summary?.sales_total_month)} 
          />
          <StatCard 
            title="Compras este Mês" 
            value={formatCurrency(summary?.purchases_total_month)} 
          />
          <StatCard 
            title="Novos Clientes" 
            value={summary?.new_clients_month || 0} 
          />
          <StatCard 
            title="Saldo em Caixa" 
            value={formatCurrency(summary?.cash_balance)} 
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
