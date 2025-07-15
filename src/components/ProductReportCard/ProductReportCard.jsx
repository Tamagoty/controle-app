// src/components/ProductReportCard/ProductReportCard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaChevronDown } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './ProductReportCard.module.css';

const ProductReportCard = ({ productSummary, dates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Este efeito busca os detalhes da venda APENAS quando o cartão é aberto pela primeira vez.
  // Isto é uma otimização de performance chamada "lazy loading".
  useEffect(() => {
    const fetchDetails = async () => {
      if (isOpen && details.length === 0) {
        setLoadingDetails(true);
        try {
          const { data, error } = await supabase.rpc('get_sales_details_for_product', {
            p_product_id: productSummary.product_id,
            p_start_date: dates.start,
            p_end_date: dates.end,
          });
          if (error) throw error;
          setDetails(data || []);
        } catch (error) {
          console.error("Erro ao buscar detalhes do produto:", error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    fetchDetails();
  }, [isOpen, productSummary.product_id, dates, details.length]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className={styles.card}>
      <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.productName}>{productSummary.product_name}</span>
        <div className={styles.summary}>
          <span>Vendas: <strong>{productSummary.number_of_sales}</strong></span>
          <span>Qtd: <strong>{productSummary.total_quantity_sold}</strong></span>
          <span>Receita: <strong>{formatCurrency(productSummary.total_revenue)}</strong></span>
        </div>
        <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>
      <div className={`${styles.content} ${isOpen ? styles.open : ''}`}>
        {loadingDetails ? <p>A carregar detalhes...</p> : (
          <div className={styles.detailsGrid}>
            <div className={styles.chartContainer}>
              <h4>Top 5 Clientes (por Receita)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={details.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="client_name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'var(--color-bg-tertiary)'}}/>
                  <Bar dataKey="total_price" name="Receita" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.salesList}>
              <h4>Últimas Vendas</h4>
              <ul>
                {details.map((sale, index) => (
                  <li key={index}>
                    <span>{sale.client_name}</span>
                    <span>{formatCurrency(sale.total_price)}</span>
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

export default ProductReportCard;
