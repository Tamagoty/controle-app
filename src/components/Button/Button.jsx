// src/components/Button/Button.jsx

import React from 'react';
import styles from './Button.module.css';

/**
 * Componente de botão reutilizável e estilizado.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - O conteúdo do botão (texto, ícone, etc.).
 * @param {() => void} [props.onClick] - A função a ser executada quando o botão é clicado.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - O tipo do botão HTML.
 * @param {'primary' | 'secondary' | 'danger' | 'success' | 'ghost'} [props.variant='primary'] - A variante visual do botão.
 * @param {boolean} [props.disabled=false] - Se o botão está desabilitado.
 * @param {string} [props.className] - Classes CSS adicionais para customização.
 * @returns {JSX.Element} O elemento do botão renderizado.
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  // Combina a classe base do botão com a classe da variante específica
  // e quaisquer classes adicionais passadas via props.
  const buttonClasses = `
    ${styles.button}
    ${styles[variant]}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
