// src/pages/Pessoas.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaUserEdit, FaUser, FaBuilding } from 'react-icons/fa';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import EntityForm from '../components/EntityForm/EntityForm';
import ToggleSwitch from '../components/ToggleSwitch/ToggleSwitch';
import Pagination from '../components/Pagination/Pagination';
import { useNotify } from '../hooks/useNotify';
import styles from './Pessoas.module.css';

const ITEMS_PER_PAGE = 10;

const Pessoas = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_entities_with_roles');
      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as entidades.');
    } finally {
      setLoading(false);
    }
  }, []); // CORREÇÃO: Removemos 'notify' das dependências para quebrar o loop.

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const sortedEntities = useMemo(() => {
    let sortableItems = [...entities];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        const valA = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
        const valB = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [entities, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return sortedEntities.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedEntities]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleStatusChange = async (entityId, newStatus) => {
    try {
      await supabase.from('entities').update({ is_active: newStatus }).eq('id', entityId);
      setEntities(current => current.map(entity => entity.id === entityId ? { ...entity, is_active: newStatus } : entity));
      notify.success('Status atualizado com sucesso!');
    } catch (error) {
      notify.error('Falha ao atualizar o status.');
    }
  };

  const handleOpenModal = (entity = null) => {
    setEditingEntity(entity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntity(null);
  };

  const handleSuccess = () => {
    fetchEntities();
    handleCloseModal();
  };

  const columns = [
    { header: 'Nome / Tipo', key: 'name', sortable: true, Cell: ({ row }) => (<div className={styles.entityNameCell}> {row.entity_type === 'Pessoa' ? <FaUser className={styles.entityIcon} /> : <FaBuilding className={styles.entityIcon} />} <div className={styles.entityInfo}> <strong>{row.name}</strong> <span className={styles.entityType}>{row.entity_type}</span> </div> </div>) },
    { header: 'Contacto', key: 'email', sortable: true, Cell: ({ row }) => (<div> <div>{row.email}</div> <div className={styles.subtext}>{row.phone}</div> </div>) },
    { header: 'Papéis', key: 'roles', sortable: true, Cell: ({ row }) => (<div className={styles.rolesCell}> {row.roles ? row.roles.split(', ').map(role => (<span key={role} className={styles.roleTag}>{role}</span>)) : 'Sem papéis'} </div>) },
    { header: 'Status', key: 'is_active', sortable: true, Cell: ({ row }) => (<ToggleSwitch checked={row.is_active} onChange={(newStatus) => handleStatusChange(row.id, newStatus)} />) },
    { header: 'Ações', key: 'actions', sortable: false, Cell: ({ row }) => (<Button icon={FaUserEdit} isIconOnly onClick={() => handleOpenModal(row)}>Editar</Button>) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Pessoas & Empresas</h1>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>Nova Pessoa/Empresa</Button>
      </div>
      
      <Card>
        {loading ? <p>A carregar...</p> : (
          <>
            <Table columns={columns} data={currentTableData} onSort={requestSort} sortConfig={sortConfig} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(sortedEntities.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEntity ? 'Editar Entidade' : 'Criar Nova Pessoa ou Empresa'}>
        <EntityForm onSuccess={handleSuccess} entityToEdit={editingEntity} />
      </Modal>
    </div>
  );
};

export default Pessoas;
