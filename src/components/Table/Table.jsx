// src/components/Table/Table.jsx

import React from 'react';
import styles from './Table.module.css';

/**
 * Componente de Tabela reutilizável, agora com suporte para renderização customizada de células.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Array<object>} props.columns - A configuração das colunas.
 * @param {Array<object>} props.data - Os dados a serem exibidos.
 * @param {string} [props.className] - Classes CSS adicionais.
 * @returns {JSX.Element} O elemento da tabela renderizado.
 */
const Table = ({ columns, data, className = '' }) => {
  const tableContainerClasses = `
    ${styles.tableContainer}
    ${className}
  `.trim();

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
                    {/* AQUI ESTÁ A MAGIA:
                        Verificamos se a coluna tem uma função 'Cell' customizada.
                        Se tiver, nós a executamos, passando a linha inteira de dados ('row').
                        Se não, exibimos o dado normalmente usando o 'accessor'.
                    */}
                    {column.Cell ? column.Cell({ row }) : row[column.accessor]}
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
