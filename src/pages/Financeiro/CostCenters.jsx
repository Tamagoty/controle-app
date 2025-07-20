// src/pages/Financeiro/CostCenters.jsx

import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaEdit } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import CostCenterForm from '../../components/CostCenterForm/CostCenterForm';
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch';
import Pagination from '../../components/Pagination/Pagination';
import { useNotify } from '../../hooks/useNotify';
import { useCostCenters } from '../../hooks/useCostCenters'; // <-- NOSSO NOVO HOOK!

const ITEMS_PER_PAGE = 10;

const CostCenters = () => {
  // --- LÓGICA DE DADOS DO HOOK ---
  const { costCenters, loading, fetchCostCenters } = useCostCenters();

  // --- ESTADOS LOCAIS DO COMPONENTE (UI) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return costCenters.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, costCenters]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updatePayload = { is_active: newStatus, finalization_date: newStatus ? null : new Date().toISOString() };
      await supabase.from('cost_centers').update(updatePayload).eq('id', id);
      fetchCostCenters(); // Recarrega os dados
      notify.success('Status atualizado!');
    } catch (error) {
      // CORREÇÃO: Utiliza a mensagem de erro da variável 'error'.
      notify.error(error.message || 'Falha ao atualizar o status.');
    }
  };

  const handleOpenModal = (costCenter = null) => {
    setEditingCostCenter(costCenter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCostCenter(null);
  };

  const handleSuccess = () => {
    fetchCostCenters();
    handleCloseModal();
  };

  const columns = [
    { header: 'Nome', key: 'name', accessor: 'name' },
    { header: 'Datas (Criação/Fim)', key: 'created_at', Cell: ({ row }) => ( <div> <strong>{new Date(row.created_at).toLocaleDateString()}</strong> {row.finalization_date && ( <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> Finalizado: {new Date(row.finalization_date).toLocaleDateString()} </div> )} </div> ) },
    { header: 'Status', key: 'is_active', Cell: ({ row }) => <ToggleSwitch checked={row.is_active} onChange={(status) => handleStatusChange(row.id, status)} /> },
    { header: 'Ações', key: 'actions', Cell: ({ row }) => <Button icon={FaEdit} isIconOnly onClick={() => handleOpenModal(row)}>Editar</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Centros de Custo</h1>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>Novo Centro de Custo</Button>
      </div>
      
      <Card>
        {loading ? <p>A carregar...</p> : (
            <>
                <Table columns={columns} data={currentTableData} />
                <Pagination currentPage={currentPage} totalPages={Math.ceil(costCenters.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
            </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}>
        <CostCenterForm onSuccess={handleSuccess} costCenterToEdit={editingCostCenter} />
      </Modal>
    </div>
  );
};

export default CostCenters;
