// src/pages/Relatorios/RelatorioProdutos.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/Card/Card';
import ProductReportCard from '../../components/ProductReportCard/ProductReportCard';
import { useRelatorioProdutos } from '../../hooks/useRelatorioProdutos'; // <-- NOSSO NOVO HOOK!
import styles from './RelatorioProdutos.module.css';

const RelatorioProdutos = () => {
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const { reportData, loading, fetchReport } = useRelatorioProdutos(dates);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReport(dates);
  }, [dates, fetchReport]);

  const filteredData = useMemo(() => {
    return reportData.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  return (
    <div>
      <div className={styles.header}>
        <h1>Relatório de Vendas por Produto</h1>
        <Card className={styles.filterContainer}>
          <input type="date" name="start" value={dates.start} onChange={e => setDates(p => ({...p, start: e.target.value}))} />
          <input type="date" name="end" value={dates.end} onChange={e => setDates(p => ({...p, end: e.target.value}))} />
        </Card>
      </div>

      <Card className={styles.searchCard}>
          <input 
            type="text"
            placeholder="Buscar produto no relatório..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
      </Card>

      {loading ? <p>A gerar relatório...</p> : (
        <div className={styles.reportContainer}>
          {filteredData.length > 0 ? (
            filteredData.map(productSummary => (
              <ProductReportCard 
                key={productSummary.product_id}
                productSummary={productSummary}
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

export default RelatorioProdutos;
