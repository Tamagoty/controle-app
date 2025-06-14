// src/components/Button/Button.jsx

import React from 'react';
import styles from './Button.module.css';

/**
 * Componente de botão reutilizável e estilizado.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} [props.icon] - Um componente de ícone a ser exibido.
 * @param {React.ReactNode} props.children - O conteúdo do botão (texto).
 * @param {boolean} [props.isIconOnly=false] - Se o botão deve exibir apenas o ícone. O children servirá de tooltip.
 * @param {() => void} [props.onClick] - A função a ser executada quando o botão é clicado.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - O tipo do botão HTML.
 * @param {'primary' | 'secondary' | 'danger' | 'success' | 'ghost'} [props.variant='primary'] - A variante visual do botão.
 * @param {boolean} [props.disabled=false] - Se o botão está desabilitado.
 * @param {string} [props.className] - Classes CSS adicionais para customização.
 * @returns {JSX.Element} O elemento do botão renderizado.
 */
const Button = ({
  icon: Icon,
  children,
  isIconOnly = false, // Nova propriedade
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const buttonClasses = `
    ${styles.button}
    ${styles[variant]}
    ${isIconOnly ? styles.iconOnly : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      // Para acessibilidade, o texto (children) vira um tooltip (title) em botões só com ícone
      title={isIconOnly ? children : undefined}
    >
      {Icon && <Icon className={styles.icon} />}
      {/* O texto (children) só é renderizado visualmente se não for um botão de ícone */}
      {!isIconOnly && children}
    </button>
  );
};

export default Button;
