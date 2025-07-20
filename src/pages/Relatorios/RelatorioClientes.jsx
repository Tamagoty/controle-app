// src/pages/Relatorios/RelatorioClientes.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/Card/Card';
import ClientReportCard from '../../components/ClientReportCard/ClientReportCard';
import { useRelatorioClientes } from '../../hooks/useRelatorioClientes'; // <-- NOSSO NOVO HOOK!
import styles from './RelatorioClientes.module.css';

const RelatorioClientes = () => {
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { reportData, loading, fetchReport } = useRelatorioClientes(dates);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReport(dates);
  }, [dates, fetchReport]);

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
          {filteredData.length > 0 ? (
            filteredData.map(clientSummary => (
              <ClientReportCard 
                key={clientSummary.client_id}
                clientSummary={clientSummary}
                dates={dates}
              />
            ))
          ) : (
            <p>Nenhum dado encontrado para o período selecionado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatorioClientes;
