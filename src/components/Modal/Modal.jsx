// src/components/Modal/Modal.jsx

import React from 'react';
import styles from './Modal.module.css';

/**
 * Componente de Modal reutilizável.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Controla se o modal está visível.
 * @param {() => void} props.onClose - Função para fechar o modal.
 * @param {string} [props.title] - O título a ser exibido no cabeçalho do modal.
 * @param {React.ReactNode} props.children - O conteúdo a ser renderizado dentro do modal.
 * @returns {JSX.Element | null} O elemento do modal ou nulo se não estiver aberto.
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  // Se o modal não estiver aberto, não renderizamos nada.
  if (!isOpen) {
    return null;
  }

  // Função para impedir que um clique dentro do conteúdo do modal o feche.
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // O 'portal' ou 'backdrop' que cobre a tela inteira.
    // O evento onClick aqui permite fechar o modal ao clicar fora dele.
    <div className={styles.backdrop} onClick={onClose}>
      {/* O container do conteúdo do modal */}
      <div className={styles.modalContent} onClick={handleContentClick}>
        <div className={styles.modalHeader}>
          {title && <h2 className={styles.modalTitle}>{title}</h2>}
          {/* Botão de fechar */}
          <button className={styles.closeButton} onClick={onClose}>
            &times; {/* Este é um 'X' em HTML */}
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
