// src/components/Sidebar/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onLinkClick }) => {
  const sidebarClasses = `
    ${styles.sidebar}
    ${isOpen ? styles.open : ''}
  `;

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onLinkClick();
    }
  };

  return (
    <aside className={sidebarClasses}>
      <div className={styles.logoContainer}>
        <h2 className={styles.logo}>Controle App</h2>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Dashboard</NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/vendas" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Vendas</NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/compras" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Compras</NavLink>
          </li>
          {/* Link para a nova página de produtos */}
          <li className={styles.navItem}>
            <NavLink to="/produtos" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Produtos</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
