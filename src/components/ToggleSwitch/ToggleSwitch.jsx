// src/components/ToggleSwitch/ToggleSwitch.jsx

import React from 'react';
import styles from './ToggleSwitch.module.css';

/**
 * Componente de interruptor (toggle switch) para valores booleanos.
 * É um componente controlado, que requer o estado e um manipulador de alteração.
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.label - O texto a ser exibido ao lado do interruptor.
 * @param {boolean} props.checked - O estado atual do interruptor (ligado/desligado).
 * @param {(checked: boolean) => void} props.onChange - Função chamada quando o estado muda.
 * @param {boolean} [props.disabled=false] - Se o interruptor está desabilitado.
 * @param {string} [props.className] - Classes CSS adicionais para o container.
 * @returns {JSX.Element} O elemento do interruptor renderizado.
 */
const ToggleSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const containerClasses = `
    ${styles.toggleSwitch}
    ${disabled ? styles.disabled : ''}
    ${className}
  `.trim();

  return (
    <label className={containerClasses}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.switchWrapper}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
        />
        <span className={styles.slider} />
      </div>
    </label>
  );
};

export default ToggleSwitch;
