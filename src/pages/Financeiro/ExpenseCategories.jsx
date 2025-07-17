// src/pages/Financeiro/ExpenseCategories.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaEdit } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ExpenseCategoryForm from '../../components/ExpenseCategoryForm/ExpenseCategoryForm';
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch';
import { useNotify } from '../../hooks/useNotify';

const ExpenseCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const notify = useNotify();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('expense_categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await supabase.from('expense_categories').update({ is_active: newStatus }).eq('id', id);
      setCategories(current => current.map(cat => cat.id === id ? { ...cat, is_active: newStatus } : cat));
      notify.success('Status atualizado!');
    } catch (error) {
      // CORREÇÃO: Agora usamos a mensagem de erro real para uma notificação mais informativa.
      notify.error(error.message || 'Falha ao atualizar o status.');
    }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchCategories();
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const columns = [
    { header: 'Nome da Categoria', key: 'name', accessor: 'name' },
    { header: 'Status', key: 'is_active', Cell: ({ row }) => <ToggleSwitch checked={row.is_active} onChange={(status) => handleStatusChange(row.id, status)} /> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => <Button icon={FaEdit} isIconOnly onClick={() => handleOpenModal(row)}>Editar</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Categorias de Despesas</h1>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>Nova Categoria</Button>
      </div>
      <Card>
        {loading ? <p>A carregar...</p> : <Table columns={columns} data={categories} />}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}>
        <ExpenseCategoryForm onSuccess={handleSuccess} categoryToEdit={editingCategory} />
      </Modal>
    </div>
  );
};

export default ExpenseCategories;
