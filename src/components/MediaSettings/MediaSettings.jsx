// src/components/MediaSettings/MediaSettings.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotify';
import styles from './MediaSettings.module.css';
import Button from '../Button/Button';

const MediaSettings = () => {
    const { user, profile, refreshUserProfile } = useAuth();
    const [settings, setSettings] = useState(profile.media_settings || {});
    const [loading, setLoading] = useState(false);
    const notify = useNotify();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ media_settings: settings })
                .eq('user_id', user.id);
            if (error) throw error;
            notify.success('Configurações guardadas!');
            refreshUserProfile();
        } catch (error) {
            notify.error(error.message || 'Falha ao guardar as configurações.');
        } finally {
            setLoading(false);
        }
    };

    const getQualityLabel = (quality) => {
        if (quality <= 0.4) return 'Baixa (Ficheiros mais pequenos)';
        if (quality <= 0.7) return 'Média (Recomendado)';
        return 'Alta (Ficheiros maiores)';
    };

    return (
        <div className={styles.container}>
            <div className={styles.formGroup}>
                <label htmlFor="image_quality">Qualidade de Compressão ({getQualityLabel(settings.image_quality)})</label>
                <input 
                    id="image_quality"
                    name="image_quality"
                    type="range" 
                    min="0.2" 
                    max="0.9" 
                    step="0.1"
                    value={settings.image_quality || 0.6}
                    onChange={handleChange}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="max_size_mb">Tamanho Máximo do Ficheiro (MB)</label>
                <input 
                    id="max_size_mb"
                    name="max_size_mb"
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" // Permite valores fracionados
                    value={settings.max_size_mb || 1}
                    onChange={handleChange}
                    className={styles.input}
                />
                <small className={styles.helperText}>Use valores fracionados (ex: 0.2 para 200KB).</small>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="max_width_or_height">Dimensão Máxima da Imagem (pixels)</label>
                <input 
                    id="max_width_or_height"
                    name="max_width_or_height"
                    type="number" 
                    min="800" 
                    max="4096" 
                    step="100"
                    value={settings.max_width_or_height || 1920}
                    onChange={handleChange}
                    className={styles.input}
                />
            </div>
            <div className={styles.formActions}>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'A Guardar...' : 'Guardar'}
                </Button>
            </div>
        </div>
    );
};

export default MediaSettings;
