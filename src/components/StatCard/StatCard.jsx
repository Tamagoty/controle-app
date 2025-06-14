// src/components/StatCard/StatCard.jsx

import React from 'react';
import styles from './StatCard.module.css';
import Card from '../Card/Card';

/**
 * Um card para exibir uma única métrica ou estatística.
 * @param {object} props
 * @param {string} props.title - O título da métrica (ex: "Vendas do Mês").
 * @param {string | number} props.value - O valor da métrica.
 */
const StatCard = ({ title, value }) => {
  return (
    <Card className={styles.statCard}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>{value}</p>
    </Card>
  );
};

export default StatCard;
