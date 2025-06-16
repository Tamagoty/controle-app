// src/components/Pagination/Pagination.jsx

import React from 'react';
import styles from './Pagination.module.css';
import Button from '../Button/Button';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Componente de paginação para navegar entre as páginas de uma tabela.
 * @param {object} props
 * @param {number} props.currentPage - A página atual.
 * @param {number} props.totalPages - O número total de páginas.
 * @param {(page: number) => void} props.onPageChange - Função para mudar de página.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Não exibe a paginação se houver apenas uma página
  }

  const handlePrevious = () => {
    onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    onPageChange(currentPage + 1);
  };

  return (
    <div className={styles.paginationContainer}>
      <Button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        isIconOnly
        variant="ghost"
        icon={FaChevronLeft} // Passa o ícone como uma propriedade
      >
        Página Anterior {/* O texto para o tooltip (dica de tela) */}
      </Button>
      
      <span className={styles.pageInfo}>
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>

      <Button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        isIconOnly
        variant="ghost"
        icon={FaChevronRight} // Passa o ícone como uma propriedade
      >
        Próxima Página {/* O texto para o tooltip (dica de tela) */}
      </Button>
    </div>
  );
};

export default Pagination;
