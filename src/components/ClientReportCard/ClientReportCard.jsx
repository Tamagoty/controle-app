// src/components/ClientReportCard/ClientReportCard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaChevronDown } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './ClientReportCard.module.css';

const ClientReportCard = ({ clientSummary, dates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (isOpen && details.length === 0) {
        setLoadingDetails(true);
        try {
          const { data, error } = await supabase.rpc('get_sales_details_for_client', {
            p_client_id: clientSummary.client_id,
            p_start_date: dates.start,
            p_end_date: dates.end,
          });
          if (error) throw error;
          setDetails(data || []);
        } catch (error) {
          console.error("Erro ao buscar detalhes do cliente:", error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    fetchDetails();
  }, [isOpen, clientSummary.client_id, dates, details.length]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className={styles.card}>
      <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.clientName}>{clientSummary.client_name}</span>
        <div className={styles.summary}>
          <span>Vendas: <strong>{clientSummary.number_of_sales}</strong></span>
          <span>Receita Total: <strong>{formatCurrency(clientSummary.total_revenue)}</strong></span>
        </div>
        <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>
      <div className={`${styles.content} ${isOpen ? styles.open : ''}`}>
        {loadingDetails ? <p>A carregar detalhes...</p> : (
          <div className={styles.detailsGrid}>
            <div className={styles.chartContainer}>
              <h4>Maiores Compras do Período</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={details.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="sale_date" tickFormatter={(date) => new Date(date).toLocaleDateString()} width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString()}`} cursor={{fill: 'var(--color-bg-tertiary)'}}/>
                  <Bar dataKey="total_amount" name="Valor da Venda" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.salesList}>
              <h4>Histórico de Compras</h4>
              <ul>
                {details.map((sale) => (
                  <li key={sale.sale_id}>
                    <div className={styles.saleItemInfo}>
                        <span>{new Date(sale.sale_date).toLocaleDateString()}</span>
                        <span className={styles.productsSummary}>{sale.products_summary}</span>
                    </div>
                    <span>{formatCurrency(sale.total_amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientReportCard;
