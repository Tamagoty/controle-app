// src/components/RecentActivity/RecentActivity.jsx

import React from 'react';
import styles from './RecentActivity.module.css';

const RecentActivity = ({ sales }) => {

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Atividade Recente</h3>
      <ul className={styles.list}>
        {(sales || []).map(sale => (
          <li key={sale.id} className={styles.listItem}>
            <div className={styles.saleInfo}>
              <span className={styles.clientName}>{sale.client_name}</span>
              <span className={styles.date}>{new Date(sale.sale_date).toLocaleDateString()}</span>
            </div>
            <span className={styles.amount}>{formatCurrency(sale.total_amount)}</span>
          </li>
        ))}
        {(!sales || sales.length === 0) && (
            <p className={styles.noActivity}>Nenhuma venda recente.</p>
        )}
      </ul>
    </div>
  );
};

export default RecentActivity;
