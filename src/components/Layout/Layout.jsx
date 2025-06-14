// src/components/Layout/Layout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Importamos o Outlet
import styles from './Layout.module.css';
import Sidebar from '../Sidebar/Sidebar';

/**
 * Componente de Layout principal da aplicação.
 * O <Outlet /> renderiza o componente da rota correspondente.
 */
const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Passamos a função de fechar para a sidebar, para que um clique no link feche o menu */}
      <Sidebar isOpen={isSidebarOpen} onLinkClick={() => setIsSidebarOpen(false)} />

      <button className={styles.hamburgerButton} onClick={toggleSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H20M4 18H20" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {isSidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}

      <main className={styles.mainContent}>
        {/* O Outlet é onde as nossas páginas (Dashboard, Vendas, etc.) serão renderizadas */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;
