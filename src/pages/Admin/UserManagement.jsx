// src/pages/Admin/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaUsersCog } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import UserRoleForm from '../../components/UserRoleForm/UserRoleForm';
import { useNotify } from '../../hooks/useNotify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const notify = useNotify();

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchUsers();
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Email', key: 'email', accessor: 'email', sortable: true },
    { 
      header: 'Papel', 
      key: 'role', 
      sortable: true,
      Cell: ({ row }) => row.role ? <span style={{textTransform: 'capitalize'}}>{row.role}</span> : <span style={{color: 'var(--color-text-secondary)'}}>Não atribuído</span>
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => (
        <Button icon={FaUsersCog} isIconOnly onClick={() => handleOpenModal(row)}>
          Gerir Papel
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Gestão de Utilizadores</h1>
      </div>
      
      <Card>
        {loading ? <p>A carregar utilizadores...</p> : <Table columns={columns} data={users} />}
      </Card>

      {selectedUser && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Gerir Papel do Utilizador"
        >
          <UserRoleForm user={selectedUser} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
