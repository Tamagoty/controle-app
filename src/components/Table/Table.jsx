// src/components/Table/Table.jsx

import React from 'react';
import styles from './Table.module.css';

/**
 * Componente de Tabela reutilizável.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Array<object>} props.columns - A configuração das colunas. Ex: [{ header: 'Nome', accessor: 'name' }]
 * @param {Array<object>} props.data - Os dados a serem exibidos nas linhas.
 * @param {string} [props.className] - Classes CSS adicionais para o container da tabela.
 * @returns {JSX.Element} O elemento da tabela renderizado.
 */
const Table = ({ columns, data, className = '' }) => {
  const tableContainerClasses = `
    ${styles.tableContainer}
    ${className}
  `.trim();

  // Verifica se temos dados e colunas para renderizar
  const hasData = data && data.length > 0;
  const hasColumns = columns && columns.length > 0;

  return (
    <div className={tableContainerClasses}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            {hasColumns && columns.map((column, index) => (
              <th key={index} className={styles.th}>
                {column.header}
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
                    {row[column.accessor]}
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
