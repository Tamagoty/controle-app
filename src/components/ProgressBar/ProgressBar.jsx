// src/components/ProgressBar/ProgressBar.jsx

import React from 'react';
import styles from './ProgressBar.module.css';

/**
 * Componente de barra de progresso para exibir o status de pagamento.
 * @param {object} props
 * @param {number} props.total - O valor total.
 * @param {number} props.paid - O valor pago.
 */
const ProgressBar = ({ total, paid }) => {
  const percentage = total > 0 ? (paid / total) * 100 : 0;
  
  let barColorClass = styles.blue;
  if (percentage >= 100) {
    barColorClass = styles.green;
  } else if (percentage > 0) {
    barColorClass = styles.orange;
  }

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressBarFill} ${barColorClass}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className={styles.progressLabels}>
        <span className={styles.paidLabel}>R$ {paid.toFixed(2)}</span>
        <span className={styles.totalLabel}>R$ {total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
