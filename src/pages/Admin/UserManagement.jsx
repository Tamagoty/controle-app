// src/pages/Admin/UserManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaUsersCog, FaUserPlus } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import UserRoleForm from '../../components/UserRoleForm/UserRoleForm';
import InviteUserForm from '../../components/InviteUserForm/InviteUserForm'; // <-- NOVO
import Pagination from '../../components/Pagination/Pagination';
import { useNotify } from '../../hooks/useNotify';

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // <-- NOVO
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_users_with_roles');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar os utilizadores.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return users.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, users]);

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleSuccess = () => {
    fetchUsers();
    setIsRoleModalOpen(false);
    setIsInviteModalOpen(false);
  };

  const columns = [
    { header: 'Email', key: 'email', accessor: 'email' },
    { header: 'Papel', key: 'role', Cell: ({ row }) => row.role ? <span style={{textTransform: 'capitalize'}}>{row.role}</span> : <span style={{color: 'var(--color-text-secondary)'}}>Não atribuído</span> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => ( <Button icon={FaUsersCog} isIconOnly onClick={() => handleOpenRoleModal(row)}>Gerir Papel</Button> ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Gestão de Utilizadores</h1>
        {/* NOVO BOTÃO DE CONVITE */}
        <Button icon={FaUserPlus} onClick={() => setIsInviteModalOpen(true)}>Convidar Utilizador</Button>
      </div>
      
      <Card>
        {loading ? <p>A carregar utilizadores...</p> : (
            <>
                <Table columns={columns} data={currentTableData} />
                <Pagination currentPage={currentPage} totalPages={Math.ceil(users.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
            </>
        )}
      </Card>

      {selectedUser && (
        <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Gerir Papel do Utilizador">
          <UserRoleForm user={selectedUser} onSuccess={handleSuccess} />
        </Modal>
      )}

      {/* NOVO MODAL DE CONVITE */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Convidar Novo Utilizador">
        <InviteUserForm onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default UserManagement;
