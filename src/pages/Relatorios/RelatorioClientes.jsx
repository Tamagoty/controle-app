// src/pages/Relatorios/RelatorioClientes.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/Card/Card';
import ClientReportCard from '../../components/ClientReportCard/ClientReportCard';
import { useNotify } from '../../hooks/useNotify';
import styles from './RelatorioClientes.module.css';

const RelatorioClientes = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const notify = useNotify();

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_client_sales_report', {
        p_start_date: dates.start,
        p_end_date: dates.end,
      });
      if (error) throw error;
      setReportData(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredData = useMemo(() => {
    return reportData.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  return (
    <div>
      <div className={styles.header}>
        <h1>Relatório de Vendas por Cliente</h1>
        <Card className={styles.filterContainer}>
          <input type="date" name="start" value={dates.start} onChange={e => setDates(p => ({...p, start: e.target.value}))} />
          <input type="date" name="end" value={dates.end} onChange={e => setDates(p => ({...p, end: e.target.value}))} />
        </Card>
      </div>

      <Card className={styles.searchCard}>
          <input 
            type="text"
            placeholder="Buscar cliente no relatório..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
      </Card>

      {loading ? <p>A gerar relatório...</p> : (
        <div className={styles.reportContainer}>
          {filteredData.map(clientSummary => (
            <ClientReportCard 
              key={clientSummary.client_id}
              clientSummary={clientSummary}
              dates={dates}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatorioClientes;
