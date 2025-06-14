// src/components/Table/Table.jsx

import React from 'react';
import styles from './Table.module.css';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

/**
 * Componente de Tabela reutilizável, agora com suporte para ordenação.
 */
const Table = ({ columns, data, onSort, sortConfig, className = '' }) => {
  const tableContainerClasses = `${styles.tableContainer} ${className}`.trim();
  const hasData = data && data.length > 0;
  const hasColumns = columns && columns.length > 0;

  const getSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null; // Sem ícone se não estiver a ordenar por esta coluna
    }
    if (sortConfig.direction === 'ascending') {
      return <FaArrowUp className={styles.sortIcon} />;
    }
    return <FaArrowDown className={styles.sortIcon} />;
  };

  return (
    <div className={tableContainerClasses}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            {hasColumns && columns.map((column, index) => (
              <th 
                key={index} 
                className={`${styles.th} ${column.sortable ? styles.sortableHeader : ''}`}
                // Adiciona o evento de clique apenas se a coluna for ordenável
                onClick={() => column.sortable && onSort(column.key)}
              >
                <div className={styles.headerContent}>
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasData ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={styles.td} data-label={column.header}>
                    {column.Cell ? column.Cell({ row }) : row[column.accessor || column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className={styles.tr}>
              <td colSpan={columns.length} className={styles.tdEmpty}>
                Nenhum dado para exibir.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
