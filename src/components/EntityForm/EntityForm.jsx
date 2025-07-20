// src/components/EntityForm/EntityForm.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNotify } from '../../hooks/useNotify';
import styles from './EntityForm.module.css';
import Button from '../Button/Button';
import { FaSpinner } from 'react-icons/fa';

const ROLES = ['Cliente', 'Fornecedor', 'Funcionário', 'Sócio'];

const EntityForm = ({ entityToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document_number: '',
    cep: '', // Novo campo para o CEP
    address: '',
    entity_type: 'Pessoa',
  });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const notify = useNotify();

  const isEditing = !!entityToEdit;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: entityToEdit.name || '',
        email: entityToEdit.email || '',
        phone: entityToEdit.phone || '',
        document_number: entityToEdit.document_number || '',
        cep: '', // O CEP não é guardado, é apenas para busca
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

  // --- LÓGICA DO VIACEP ---
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cep.length !== 8) {
      return; // Só busca se tiver 8 dígitos
    }
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('Falha na resposta da API.');
      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP não encontrado.');
      }
      setFormData(prev => ({
        ...prev,
        address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}`,
      }));
    } catch (error) {
      notify.error(error.message || 'Falha ao buscar o CEP.');
    } finally {
      setCepLoading(false);
    }
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
      const rpcName = isEditing ? 'update_entity_with_roles' : 'create_entity_with_roles';
      const params = {
        name_param: formData.name,
        email_param: formData.email,
        phone_param: formData.phone,
        document_number_param: formData.document_number,
        address_param: formData.address,
        entity_type_param: formData.entity_type,
        roles_param: selectedRoles
      };
      if (isEditing) {
        params.entity_id_param = entityToEdit.id;
      }

      ({ error } = await supabase.rpc(rpcName, params));
      
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
      
      <div className={styles.addressSection}>
        <div className={styles.formGroup}>
          <label htmlFor="cep">
            CEP
            {cepLoading && <FaSpinner className={styles.spinner} />}
          </label>
          <input id="cep" name="cep" type="text" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="Digite o CEP para buscar" />
        </div>
        <div className={styles.formGroup}>
          <label>Endereço</label>
          <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} />
        </div>
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
