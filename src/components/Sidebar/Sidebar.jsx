// src/components/Sidebar/Sidebar.jsx

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppBranding } from '../../hooks/useAppBranding';
import { FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import Button from '../Button/Button';

// Componente auxiliar para as seções expansíveis
const SidebarSection = ({ title, children, sectionKey, openSection, setOpenSection }) => {
    const isOpen = openSection === sectionKey;
    return (
        <li className={styles.navSection}>
            <button className={styles.sectionHeader} onClick={() => setOpenSection(isOpen ? null : sectionKey)}>
                <span>{title}</span>
                <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
            </button>
            <div className={`${styles.sectionLinks} ${isOpen ? styles.open : ''}`}>
                <ul>{children}</ul>
            </div>
        </li>
    );
}

// Componente auxiliar para os itens de link
const NavItem = ({ to, children, onClick }) => (
    <li>
        <NavLink 
            to={to} 
            className={({ isActive }) => `${styles.navLink} ${styles.subLink} ${isActive ? styles.active : ''}`} 
            onClick={onClick}
        >
            {children}
        </NavLink>
    </li>
);

const Sidebar = ({ isOpen, onLinkClick }) => {
  const { signOut, role } = useAuth();
  const { appName, logoUrl } = useAppBranding();
  const [openSection, setOpenSection] = useState('operacional');
  const sidebarClasses = `${styles.sidebar} ${isOpen ? styles.open : ''}`;
  const handleLinkClick = () => { if (window.innerWidth <= 768) onLinkClick(); };

  return (
    <aside className={sidebarClasses}>
      <div>
        <div className={styles.logoContainer}>
          {/* O logo e o nome agora estão dentro de um NavLink que aponta para a página inicial */}
          <NavLink to="/" className={styles.logoLink} onClick={handleLinkClick}>
            {logoUrl && <img src={logoUrl} alt="Logo do Aplicativo" className={styles.logoImage} />}
            <h2 className={styles.logo} title={appName}>{appName}</h2>
          </NavLink>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
                <NavLink to="/" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={handleLinkClick}>Dashboard</NavLink>
            </li>
            
            <SidebarSection title="Operacional" sectionKey="operacional" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/vendas" onClick={handleLinkClick}>Vendas</NavItem>
                <NavItem to="/compras" onClick={handleLinkClick}>Compras</NavItem>
            </SidebarSection>

            <SidebarSection title="Financeiro" sectionKey="financeiro" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/financeiro/contas-a-receber" onClick={handleLinkClick}>Contas a Receber</NavItem>
                <NavItem to="/financeiro/contas-a-pagar" onClick={handleLinkClick}>Contas a Pagar</NavItem>
                <NavItem to="/financeiro/despesas" onClick={handleLinkClick}>Despesas</NavItem>
                <NavItem to="/financeiro/comissoes" onClick={handleLinkClick}>Comissões</NavItem>
                <NavItem to="/financeiro/centros-de-custo" onClick={handleLinkClick}>Centros de Custo</NavItem>
            </SidebarSection>
            
            <SidebarSection title="Capital" sectionKey="capital" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/capital/socios" onClick={handleLinkClick}>Sócios</NavItem>
                <NavItem to="/capital/transacoes" onClick={handleLinkClick}>Transações</NavItem>
            </SidebarSection>
            
            <SidebarSection title="Catálogos" sectionKey="catalogos" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/produtos" onClick={handleLinkClick}>Produtos</NavItem>
                <NavItem to="/pessoas" onClick={handleLinkClick}>Pessoas</NavItem>
            </SidebarSection>

            <SidebarSection title="Relatórios" sectionKey="relatorios" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/relatorios/financeiro" onClick={handleLinkClick}>Financeiro</NavItem>
            </SidebarSection>
            
            <SidebarSection title="Configurações" sectionKey="configuracoes" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/configuracoes/meu-perfil" onClick={handleLinkClick}>Meu Perfil</NavItem>
                {/* CORREÇÃO: Adicionado o link para a página de personalização de tema */}
                <NavItem to="/configuracoes/tema" onClick={handleLinkClick}>Aparência</NavItem>
            </SidebarSection>

            {role === 'admin' && (
              <SidebarSection title="Administração" sectionKey="admin" openSection={openSection} setOpenSection={setOpenSection}>
                <NavItem to="/admin/users" onClick={handleLinkClick}>Utilizadores</NavItem>
              </SidebarSection>
            )}
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
