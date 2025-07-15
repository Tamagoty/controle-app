// src/components/ProductReportCard/ProductReportCard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaChevronDown } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './ProductReportCard.module.css';

const ProductReportCard = ({ productSummary, dates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState({ top_clients: [], sales_history: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [openClients, setOpenClients] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (isOpen && details.sales_history.length === 0) {
        setLoadingDetails(true);
        try {
          const { data, error } = await supabase.rpc('get_sales_details_for_product', {
            p_product_id: productSummary.product_id,
            p_start_date: dates.start,
            p_end_date: dates.end,
          });
          if (error) throw error;
          setDetails(data || { top_clients: [], sales_history: [] });
        } catch (error) {
          console.error("Erro ao buscar detalhes do produto:", error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    fetchDetails();
  }, [isOpen, productSummary.product_id, dates, details.sales_history.length]);

  // CORREÇÃO: A lógica de agrupamento agora também calcula o total para cada cliente.
  const groupedSales = useMemo(() => {
    return details.sales_history.reduce((acc, sale) => {
      const client = sale.client_name;
      if (!acc[client]) {
        acc[client] = {
          sales: [],
          total: 0,
        };
      }
      acc[client].sales.push(sale);
      acc[client].total += sale.total_price;
      return acc;
    }, {});
  }, [details.sales_history]);

  const toggleClient = (clientName) => {
    setOpenClients(prev => 
      prev.includes(clientName) 
        ? prev.filter(name => name !== clientName) 
        : [...prev, clientName]
    );
  };

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
                <BarChart data={details.top_clients} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="client_name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'var(--color-bg-tertiary)'}}/>
                  <Bar dataKey="total_revenue" name="Receita Total" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.salesList}>
              <h4>Vendas por Cliente</h4>
              <ul>
                {Object.entries(groupedSales).map(([clientName, clientData]) => {
                    const isClientOpen = openClients.includes(clientName);
                    return (
                        <li key={clientName}>
                            <button className={styles.clientHeader} onClick={() => toggleClient(clientName)}>
                                {/* Exibe o nome do cliente e o total de compras dele */}
                                <span>{clientName} ({formatCurrency(clientData.total)})</span>
                                <FaChevronDown className={`${styles.chevron} ${isClientOpen ? styles.open : ''}`} />
                            </button>
                            {/* A lista de vendas individuais agora fica dentro da secção retrátil */}
                            <div className={`${styles.clientSales} ${isClientOpen ? styles.open : ''}`}>
                                <ul>
                                    {clientData.sales.map(sale => (
                                        <li key={sale.sale_id} className={styles.saleDetail}>
                                            <span>{new Date(sale.sale_date).toLocaleDateString()}</span>
                                            <span>{formatCurrency(sale.total_price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReportCard;
