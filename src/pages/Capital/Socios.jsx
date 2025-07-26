// src/pages/Capital/Socios.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaUserEdit } from 'react-icons/fa';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import PartnerForm from '../../components/PartnerForm/PartnerForm';
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch';
import Pagination from '../../components/Pagination/Pagination';
import { useNotify } from '../../hooks/useNotify';

const ITEMS_PER_PAGE = 10;

const Socios = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  const totalEquity = useMemo(() => {
    return partners.filter(p => p.is_active).reduce((acc, p) => acc + parseFloat(p.equity_percentage || 0), 0);
  }, [partners]);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_partners_with_details');
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar os sócios.');
    } finally {
      setLoading(false);
    }
  }, [notify]); //CORREÇÃO: Adicionado 'notify' às dependências.


  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return partners.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, partners]);

  const handleStatusChange = async (partnerId, entityId, newStatus) => {
    if (!partnerId) {
        notify.error("Complete primeiro o registo do sócio para alterar o status.");
        return;
    }
    try {
      await supabase.from('partners').update({ is_active: newStatus, exit_date: newStatus ? null : new Date().toISOString() }).eq('id', partnerId);
      setPartners(current => current.map(p => p.entity_id === entityId ? { ...p, is_active: newStatus } : p));
      notify.success('Status do sócio atualizado!');
    } catch (error) {
      notify.error(error.message || 'Falha ao atualizar o status.');
    }
  };
  
  const handleOpenModal = (partner = null) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleSuccess = () => {
    fetchPartners();
    handleCloseModal();
  };

  const columns = [
    { header: 'Sócio', key: 'name', accessor: 'name' },
    { header: 'Participação', key: 'equity_percentage', Cell: ({ row }) => row.equity_percentage ? `${row.equity_percentage}%` : <span style={{color: 'var(--color-warning)'}}>Pendente</span> },
    { header: 'Data de Entrada', key: 'entry_date', Cell: ({row}) => row.entry_date ? new Date(row.entry_date).toLocaleDateString() : '---' },
    { header: 'Status', key: 'is_active', Cell: ({row}) => <ToggleSwitch checked={row.is_active} onChange={(status) => handleStatusChange(row.id, row.entity_id, status)} disabled={!row.id} /> },
    { header: 'Ações', key: 'actions', Cell: ({row}) => <Button icon={FaUserEdit} isIconOnly onClick={() => handleOpenModal(row)}>Editar/Completar</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Gestão de Sócios</h1>
        <small style={{textAlign: 'right', color: 'var(--color-text-secondary)'}}>Crie primeiro em "Pessoas",<br/> depois adicione como sócio.</small>
      </div>

      <Card style={{marginBottom: 'var(--spacing-lg)'}}>
        <div style={{textAlign: 'center'}}>
            <h3 style={{color: 'var(--color-text-secondary)'}}>Total de Participação (Ativos)</h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: totalEquity > 100 ? 'var(--color-danger)' : 'var(--color-success)'}}>{totalEquity.toFixed(2)}%</p>
        </div>
      </Card>
      
      <Card>
        {loading ? <p>A carregar...</p> : (
            <>
                <Table columns={columns} data={currentTableData} />
                <Pagination currentPage={currentPage} totalPages={Math.ceil(partners.length / ITEMS_PER_PAGE)} onPageChange={page => setCurrentPage(page)} />
            </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPartner && editingPartner.id ? 'Editar Sócio' : 'Completar Registo de Sócio'}>
        <PartnerForm onSuccess={handleSuccess} partnerToEdit={editingPartner} currentTotalEquity={totalEquity} />
      </Modal>
    </div>
  );
};

export default Socios;
