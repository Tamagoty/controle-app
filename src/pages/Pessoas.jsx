// src/pages/Pessoas.jsx

import React, { useState, useMemo } from 'react';
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
import { usePessoas } from '../hooks/usePessoas'; // <-- NOSSO NOVO HOOK!
import styles from './Pessoas.module.css';

const ITEMS_PER_PAGE = 10;

const Pessoas = () => {
  // --- LÓGICA DE DADOS DO HOOK ---
  const { entities, loading, fetchEntities } = usePessoas();

  // --- ESTADOS LOCAIS DO COMPONENTE (UI) ---
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const notify = useNotify();

  const filteredEntities = useMemo(() => {
    if (!searchTerm) {
      return entities;
    }
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entity.phone && entity.phone.includes(searchTerm))
    );
  }, [entities, searchTerm]);

  const sortedEntities = useMemo(() => {
    let sortableItems = [...filteredEntities];
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
  }, [filteredEntities, sortConfig]);

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
      fetchEntities();
      notify.success('Status atualizado com sucesso!');
    } catch (error) {
      notify.error(error.message || 'Falha ao atualizar o status.');
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
      <div className={styles.header}>
        <h1>Pessoas & Empresas</h1>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>Nova Pessoa/Empresa</Button>
      </div>
      
      <Card className={styles.filterCard}>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </Card>

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
