// src/components/TableSkeleton/TableSkeleton.jsx

import React from 'react';
import styles from './TableSkeleton.module.css';

/**
 * Componente para exibir um esqueleto de carregamento para tabelas.
 * @param {object} props
 * @param {number} [props.rows=5] - O número de linhas do esqueleto a serem exibidas.
 * @param {number} [props.columns=4] - O número de colunas do esqueleto.
 * @returns {JSX.Element}
 */
const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  // Cria um array de arrays para representar a estrutura da tabela
  const skeletonGrid = Array.from({ length: rows }, () => Array.from({ length: columns }));

  return (
    <div className={styles.skeletonContainer}>
      {skeletonGrid.map((cols, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonRow}>
          {cols.map((_, colIndex) => (
            <div key={colIndex} className={styles.skeletonCell}></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
