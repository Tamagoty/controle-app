// src/pages/Configuracoes/MeuPerfil.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card/Card';
import PasswordChangeForm from '../../components/PasswordChangeForm/PasswordChangeForm';
import styles from './MeuPerfil.module.css';

const MeuPerfil = () => {
    const { user, role } = useAuth();

    return (
        <div>
            <h1>Meu Perfil</h1>
            
            <Card className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Informações da Conta</h2>
                <div className={styles.infoGrid}>
                    <div>
                        <label>Email</label>
                        <p>{user?.email}</p>
                    </div>
                    <div>
                        <label>Papel</label>
                        <p className={styles.role}>{role || 'Não definido'}</p>
                    </div>
                </div>
            </Card>

            <Card className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Alterar Palavra-passe</h2>
                <PasswordChangeForm />
            </Card>
        </div>
    );
};

export default MeuPerfil;
