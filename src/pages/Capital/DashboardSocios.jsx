// src/pages/Capital/DashboardSocios.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import StatCard from '../../components/StatCard/StatCard';
import { useNotify } from '../../hooks/useNotify';
import styles from './DashboardSocios.module.css'; // Crie este ficheiro CSS

const DashboardSocios = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  // Busca a lista de sócios para preencher o seletor
  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase.rpc('get_partners_with_details');
      if (error) {
        notify.error('Não foi possível carregar a lista de sócios.');
      } else {
        setPartners(data.filter(p => p.is_active) || []);
      }
    };
    fetchPartners();
  }, [notify]);

  // Busca os dados do dashboard quando um sócio é selecionado
  const fetchDashboardData = useCallback(async (partnerId) => {
    if (!partnerId) {
      setDashboardData(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
        p_partner_id: partnerId,
      });
      if (error) throw error;
      setDashboardData(data);
    } catch (err) {
      notify.error(err.message || 'Não foi possível carregar os dados do sócio.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchDashboardData(selectedPartnerId);
  }, [selectedPartnerId, fetchDashboardData]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const transactionColumns = [
    { header: 'Data', key: 'transaction_date', Cell: ({ row }) => new Date(row.transaction_date).toLocaleDateString() },
    { header: 'Tipo', key: 'transaction_type', Cell: ({ row }) => (<span className={row.transaction_type === 'Aporte' ? styles.inflow : styles.outflow}>{row.transaction_type}</span>) },
    { header: 'Descrição', key: 'description', accessor: 'description' },
    { header: 'Valor', key: 'amount', Cell: ({ row }) => formatCurrency(row.amount) },
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1>Dashboard de Sócios</h1>
        <div className={styles.selectorContainer}>
          <label htmlFor="partner-select">Selecione um Sócio:</label>
          <select
            id="partner-select"
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className={styles.partnerSelect}
          >
            <option value="">-- Escolha um sócio --</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>A carregar dados do sócio...</p>}

      {!loading && dashboardData && (
        <>
          <div className={styles.summaryGrid}>
            <StatCard title="Total de Aportes" value={formatCurrency(dashboardData.summary.total_aportes)} />
            <StatCard title="Total de Retiradas" value={formatCurrency(dashboardData.summary.total_retiradas)} />
            <StatCard title="Saldo Atual em Capital" value={formatCurrency(dashboardData.summary.saldo_atual)} />
          </div>

          <Card>
            <h2>Histórico de Transações</h2>
            <Table columns={transactionColumns} data={dashboardData.transactions} />
          </Card>
        </>
      )}

      {!loading && !selectedPartnerId && (
        <Card>
          <p>Por favor, selecione um sócio para ver os seus dados.</p>
        </Card>
      )}
    </div>
  );
};

export default DashboardSocios;
