// src/components/Modal/Modal.jsx

import React from 'react';
import styles from './Modal.module.css';

/**
 * Componente de Modal reutilizável.
 * @param {object} props
 * @param {boolean} props.isOpen - Controla se o modal está visível.
 * @param {() => void} props.onClose - Função para fechar o modal.
 * @param {string} [props.title] - O título a ser exibido no cabeçalho.
 * @param {React.ReactNode} props.children - O conteúdo a ser renderizado.
 * @param {'md' | 'lg' | 'xl'} [props.size='md'] - O tamanho do modal.
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Constrói as classes para o conteúdo do modal, aplicando o tamanho
  const modalContentClasses = `
    ${styles.modalContent}
    ${styles[size] || styles.md}
  `.trim();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={modalContentClasses} onClick={handleContentClick}>
        <div className={styles.modalHeader}>
          {title && <h2 className={styles.modalTitle}>{title}</h2>}
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
