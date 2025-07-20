// src/components/InviteUserForm/InviteUserForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './InviteUserForm.module.css'; // Crie este ficheiro de estilos
import Button from '../Button/Button';

const InviteUserForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Esta é a chamada para a nossa Edge Function.
      // O nome 'invite-user' deve ser o mesmo que você deu à função no Supabase.
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: email },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }
      
      notify.success(`Convite enviado para ${email}!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao enviar o convite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.description}>
        Insira o email do novo funcionário. Ele receberá um convite para criar uma conta e será automaticamente associado com o papel de "Vendedor".
      </p>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email do Funcionário</label>
        <input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="email@exemplo.com"
        />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Enviar...' : 'Enviar Convite'}
        </Button>
      </div>
    </form>
  );
};

export default InviteUserForm;
