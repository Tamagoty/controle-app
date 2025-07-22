// src/components/AvatarUploader/AvatarUploader.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import imageCompression from 'browser-image-compression';
import styles from './AvatarUploader.module.css';
import { FaUserCircle, FaUpload, FaTrash, FaSpinner } from 'react-icons/fa';
import Button from '../Button/Button';

const AvatarUploader = ({ onUpload }) => {
    const { user, profile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const notify = useNotify();

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, initialQuality: 0.8 };
            const compressedFile = await imageCompression(file, options);

            const filePath = `${user.id}/${Date.now()}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: publicUrl })
                .eq('user_id', user.id);
            
            if (updateError) throw updateError;
            
            notify.success('Avatar atualizado com sucesso!');
            if (onUpload) onUpload();

        } catch (error) {
            notify.error(error.message || 'Falha ao carregar o avatar.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!profile.avatar_url) return;
        try {
            await supabase.from('user_profiles').update({ avatar_url: null }).eq('user_id', user.id);
            notify.success('Avatar removido.');
            if (onUpload) onUpload();
        } catch (error) {
            // CORREÇÃO: Utiliza a mensagem de erro da variável 'error'.
            notify.error(error.message || 'Falha ao remover o avatar.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.avatarPreview}>
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" />
                ) : (
                    <FaUserCircle className={styles.placeholder} />
                )}
            </div>
            <div className={styles.actions}>
                <label htmlFor="avatar-upload" className={styles.uploadButton}>
                    {uploading ? <FaSpinner className={styles.spinner} /> : <FaUpload />}
                    {uploading ? 'A carregar...' : 'Alterar'}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {profile.avatar_url && (
                    <Button onClick={handleDelete} variant="danger" icon={FaTrash} isIconOnly>Apagar</Button>
                )}
            </div>
        </div>
    );
};

export default AvatarUploader;
