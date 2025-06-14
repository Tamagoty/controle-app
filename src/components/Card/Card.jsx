// src/components/Card/Card.jsx

import React from 'react';
import styles from './Card.module.css';

/**
 * Componente de Card genérico para agrupar conteúdo.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - O conteúdo a ser renderizado dentro do card.
 * @param {string} [props.className] - Classes CSS adicionais para customização do container.
 * @returns {JSX.Element} O elemento do card renderizado.
 */
const Card = ({ children, className = '' }) => {
  const cardClasses = `
    ${styles.card}
    ${className}
  `.trim();

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

export default Card;
