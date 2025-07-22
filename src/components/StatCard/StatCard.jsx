// src/components/StatCard/StatCard.jsx

import React from 'react';
import styles from './StatCard.module.css';
import Card from '../Card/Card';

/**
 * Um card para exibir uma única métrica ou estatística.
 * @param {object} props
 * @param {string} props.title - O título da métrica (ex: "Vendas do Mês").
 * @param {string | number} props.value - O valor da métrica.
 * @param {'revenue' | 'expense' | 'balance' | 'neutral'} [props.type='neutral'] - O tipo de métrica para estilização.
 */
const StatCard = ({ title, value, type = 'neutral' }) => {
  // Constrói as classes CSS, combinando a classe base com a classe do tipo (ex: styles.revenue)
  const cardClasses = `${styles.statCard} ${styles[type] || ''}`;

  return (
    <Card className={cardClasses}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>{value}</p>
    </Card>
  );
};

export default StatCard;
