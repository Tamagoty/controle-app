// src/components/SalesChart/SalesChart.jsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './SalesChart.module.css';

/**
 * Gráfico que exibe a evolução das vendas ao longo do tempo.
 * @param {object} props
 * @param {Array<{date: string, total: number}>} props.data - Os dados para o gráfico.
 */
const SalesChart = ({ data }) => {

  const formatYAxis = (tickItem) => {
    // Formata o eixo Y para '1k', '2k', etc.
    if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(0)}k`;
    }
    return tickItem;
  };
  
  const formatTooltip = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" />
          <YAxis stroke="var(--color-text-secondary)" tickFormatter={formatYAxis} />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: 'var(--color-bg-tertiary)', 
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)'
            }}
            formatter={formatTooltip}
          />
          <Line type="monotone" dataKey="total" name="Vendas" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
