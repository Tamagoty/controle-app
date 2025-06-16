// src/components/PasswordChangeForm/PasswordChangeForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext'; // Importamos o useAuth para aceder ao email do utilizador
import { useNotify } from '../../hooks/useNotify';
import styles from './PasswordChangeForm.module.css';
import Button from '../Button/Button';

const PasswordChangeForm = () => {
  const [currentPassword, setCurrentPassword] = useState(''); // <-- NOVO ESTADO
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const { user } = useAuth(); // <-- Obtém o utilizador atual do nosso contexto

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notify.error('As novas palavras-passe não coincidem.');
      return;
    }
    if (password.length < 6) {
        notify.error('A nova palavra-passe deve ter pelo menos 6 caracteres.');
        return;
    }

    setLoading(true);
    try {
      // Passo 1: Validar a palavra-passe atual.
      // A forma mais segura de fazer isto é tentar fazer um novo "signIn" com a senha fornecida.
      // Se funcionar, a senha está correta. Se der erro, está incorreta.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('A sua palavra-passe atual está incorreta.');
      }

      // Passo 2: Se a palavra-passe atual estiver correta, atualiza para a nova.
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      notify.success('Palavra-passe atualizada com sucesso!');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      notify.error(error.message || 'Falha ao atualizar a palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* NOVO CAMPO PARA A PALAVRA-PASSE ATUAL */}
      <div className={styles.formGroup}>
        <label htmlFor="currentPassword">Palavra-passe Atual</label>
        <input 
            id="currentPassword" 
            name="currentPassword" 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            required 
        />
      </div>

      <hr className={styles.divider} />

      <div className={styles.formGroup}>
        <label htmlFor="password">Nova Palavra-passe</label>
        <input 
            id="password" 
            name="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Pelo menos 6 caracteres"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirmar Nova Palavra-passe</label>
        <input 
            id="confirmPassword" 
            name="confirmPassword" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
        />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading || !password || !currentPassword}>
          {loading ? 'A Guardar...' : 'Alterar Palavra-passe'}
        </Button>
      </div>
    </form>
  );
};

export default PasswordChangeForm;
