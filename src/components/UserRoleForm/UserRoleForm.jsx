// src/components/UserRoleForm/UserRoleForm.jsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './UserRoleForm.module.css';
import Button from '../Button/Button';

const UserRoleForm = ({ user, onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState(user.role || 'vendedor');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORREÇÃO: Adicionamos a opção { onConflict: 'user_id' }.
      // Isto diz ao Supabase: "Se já existir uma linha com este user_id,
      // em vez de criar uma nova, por favor, atualize a que já existe."
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          { 
            user_id: user.user_id,
            role: selectedRole 
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;
      notify.success('Papel do utilizador atualizado com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || 'Falha ao atualizar o papel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.userInfo}>
        <label>Utilizador</label>
        <p>{user.email}</p>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="role">Atribuir Papel</label>
        <select id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={styles.select}>
          <option value="vendedor">Vendedor</option>
          <option value="gestor">Gestor</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </form>
  );
};

export default UserRoleForm;
