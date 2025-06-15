// src/components/EntityForm/EntityForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './EntityForm.module.css';
import Button from '../Button/Button';

const ROLES = ['Cliente', 'Fornecedor', 'Funcionário', 'Sócio'];

const EntityForm = ({ entityToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document_number: '',
    address: '',
    entity_type: 'Pessoa',
  });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const isEditing = !!entityToEdit;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: entityToEdit.name || '',
        email: entityToEdit.email || '',
        phone: entityToEdit.phone || '',
        document_number: entityToEdit.document_number || '',
        address: entityToEdit.address || '',
        entity_type: entityToEdit.entity_type || 'Pessoa',
      });
      setSelectedRoles(entityToEdit.roles ? entityToEdit.roles.split(', ') : []);
    }
  }, [entityToEdit, isEditing]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;
      if (isEditing) {
        // Modo de Edição
        ({ error } = await supabase.rpc('update_entity_with_roles', {
          entity_id_param: entityToEdit.id,
          name_param: formData.name,
          email_param: formData.email,
          phone_param: formData.phone,
          document_number_param: formData.document_number,
          address_param: formData.address,
          entity_type_param: formData.entity_type,
          roles_param: selectedRoles
        }));
      } else {
        // Modo de Criação
        ({ error } = await supabase.rpc('create_entity_with_roles', {
          name_param: formData.name,
          email_param: formData.email,
          phone_param: formData.phone,
          document_number_param: formData.document_number,
          address_param: formData.address,
          entity_type_param: formData.entity_type,
          roles_param: selectedRoles
        }));
      }

      if (error) throw error;

      notify.success(`Entidade ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      notify.error(error.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} a entidade.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Nome / Razão Social</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
      </div>

      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        </div>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="document_number">CPF / CNPJ</label>
          <input id="document_number" name="document_number" type="text" value={formData.document_number} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label>Tipo de Entidade</label>
          <select name="entity_type" value={formData.entity_type} onChange={handleChange}>
            <option value="Pessoa">Pessoa</option>
            <option value="Empresa">Empresa</option>
          </select>
        </div>
      </div>
      
      <div className={styles.formGroup}>
          <label>Endereço</label>
          <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} />
      </div>

      <div className={styles.formGroup}>
        <label>Papéis</label>
        <div className={styles.rolesContainer}>
          {ROLES.map(role => (
            <label key={role} className={styles.roleLabel}>
              <input 
                type="checkbox" 
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleChange(role)}
              />
              {role}
            </label>
          ))}
        </div>
      </div>
      
      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'A Guardar...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};

export default EntityForm;
