// src/components/Layout/Layout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header'; // <-- NOVO

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} onLinkClick={() => setIsSidebarOpen(false)} />
      
      {isSidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}

      <div className={styles.contentWrapper}>
        <Header onToggleSidebar={toggleSidebar} />
        <main className={styles.mainContent}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;
