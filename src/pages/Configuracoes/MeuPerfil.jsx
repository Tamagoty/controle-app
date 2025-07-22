// src/pages/Configuracoes/MeuPerfil.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card/Card';
import PasswordChangeForm from '../../components/PasswordChangeForm/PasswordChangeForm';
import AvatarUploader from '../../components/AvatarUploader/AvatarUploader'; // <-- NOVO
import MediaSettings from '../../components/MediaSettings/MediaSettings'; // <-- NOVO
import styles from './MeuPerfil.module.css';

const MeuPerfil = () => {
    const { user, profile, refreshUserProfile } = useAuth();

    return (
        <div>
            <h1>Meu Perfil</h1>
            
            <div className={styles.profileGrid}>
                <div className={styles.mainColumn}>
                    <Card className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Informações da Conta</h2>
                        <div className={styles.infoGrid}>
                            <div>
                                <label>Email</label>
                                <p>{user?.email}</p>
                            </div>
                            <div>
                                <label>Papel</label>
                                <p className={styles.role}>{profile.role || 'Não definido'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Alterar Palavra-passe</h2>
                        <PasswordChangeForm />
                    </Card>
                </div>

                <div className={styles.sideColumn}>
                    <Card className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Avatar</h2>
                        <AvatarUploader onUpload={refreshUserProfile} />
                    </Card>

                    <Card className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Qualidade de Média</h2>
                        <MediaSettings />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MeuPerfil;
