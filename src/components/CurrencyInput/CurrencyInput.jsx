// src/components/CurrencyInput/CurrencyInput.jsx

import React, { useState, useEffect } from 'react';
import styles from './CurrencyInput.module.css';

const CurrencyInput = ({ value, onChange, placeholder = "R$ 0,00" }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const formatCurrency = (numberValue) => {
    if (numberValue === null || numberValue === undefined || isNaN(Number(numberValue))) {
      return '';
    }
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return formatter.format(numberValue);
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    const numericString = formattedValue
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    return parseFloat(numericString) || 0;
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    if (numericValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
    }
    const number = parseFloat(numericValue) / 100;
    setDisplayValue(formatCurrency(number));
    onChange(number);
  };

  const handleBlur = () => {
    setDisplayValue(formatCurrency(parseCurrency(displayValue)));
  };

  return (
    <input
      type="text"
      className={`${styles.input} ${styles.currencyInput}`}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
};

export default CurrencyInput;
