// src/pages/Configuracoes/MeuPerfil.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import Card from '../../components/Card/Card';
import PasswordChangeForm from '../../components/PasswordChangeForm/PasswordChangeForm';
import AvatarUploader from '../../components/AvatarUploader/AvatarUploader';
import MediaSettings from '../../components/MediaSettings/MediaSettings';
import Button from '../../components/Button/Button';
import styles from './MeuPerfil.module.css';

const MeuPerfil = () => {
    const { user, profile, refreshUserProfile } = useAuth();
    const [name, setName] = useState('');
    const [loadingName, setLoadingName] = useState(false);
    const notify = useNotify();

    useEffect(() => {
        // Preenche o campo de nome com o nome do perfil quando o componente carrega
        if (profile.name) {
            setName(profile.name);
        }
    }, [profile.name]);

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        setLoadingName(true);
        try {
            const { error } = await supabase.rpc('update_my_name', { new_name: name });
            if (error) throw error;
            notify.success('Nome atualizado com sucesso!');
            // Refresca o perfil para que o nome apareça no header
            refreshUserProfile();
        } catch (error) {
            notify.error(error.message || 'Falha ao atualizar o nome.');
        } finally {
            setLoadingName(false);
        }
    };

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
                        {/* NOVO FORMULÁRIO DE NOME */}
                        <form onSubmit={handleNameUpdate} className={styles.nameForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Seu Nome</label>
                                <input 
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Digite o seu nome completo"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loadingName}>
                                {loadingName ? 'A Guardar...' : 'Guardar Nome'}
                            </Button>
                        </form>
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
