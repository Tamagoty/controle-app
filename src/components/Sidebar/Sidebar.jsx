// src/components/Sidebar/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSignOutAlt } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import Button from '../Button/Button';

const Sidebar = ({ isOpen, onLinkClick }) => {
  const { signOut } = useAuth();
  const sidebarClasses = `${styles.sidebar} ${isOpen ? styles.open : ''}`;
  const handleLinkClick = () => { if (window.innerWidth <= 768) onLinkClick(); };

  return (
    <aside className={sidebarClasses}>
      <div>
        <div className={styles.logoContainer}>
          <h2 className={styles.logo}>Controle App</h2>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}><NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Dashboard</NavLink></li>
            <li className={styles.navItem}><NavLink to="/vendas" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Vendas</NavLink></li>
            <li className={styles.navItem}><NavLink to="/compras" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Compras</NavLink></li>
            <li className={styles.navItem}><NavLink to="/produtos" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Produtos</NavLink></li>
            <li className={styles.navItem}><NavLink to="/pessoas" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Pessoas</NavLink></li>
            <li className={styles.navItem}><NavLink to="/financeiro/despesas" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Despesas</NavLink></li>
            <li className={styles.navItem}><NavLink to="/financeiro/comissoes" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Comissões</NavLink></li>
            <li className={styles.navItem}><NavLink to="/financeiro/centros-de-custo" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Centros de Custo</NavLink></li>
            <li className={styles.navItem}><NavLink to="/capital/socios" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={handleLinkClick}>Sócios</NavLink></li>
          </ul>
        </nav>
      </div>
      <div className={styles.footer}>
        <Button onClick={signOut} variant="danger" className={styles.logoutButton}>
          <FaSignOutAlt />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
