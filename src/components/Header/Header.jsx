// src/components/Header/Header.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';
import { FaUserCircle } from 'react-icons/fa';

const Header = ({ onToggleSidebar }) => {
    const { user, profile } = useAuth();

    // Exibe o nome do perfil se existir, caso contrário, volta a exibir o email
    const displayName = profile.name || user?.email;

    return (
        <header className={styles.header}>
            <button className={styles.hamburgerButton} onClick={onToggleSidebar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar do utilizador" className={styles.avatar} />
                ) : (
                    <FaUserCircle className={styles.avatarPlaceholder} />
                )}
            </div>
        </header>
    );
};

export default Header;
