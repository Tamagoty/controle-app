// src/pages/Compras.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import PurchaseForm from '../components/PurchaseForm/PurchaseForm';
import PurchasePaymentForm from '../components/PurchasePaymentForm/PurchasePaymentForm';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Pagination from '../components/Pagination/Pagination'; // 1. Importa o novo componente de Paginação
import { useNotify } from '../hooks/useNotify';

// 2. Define uma constante para o número de itens por página.
//    Isto facilita a alteração deste valor no futuro.
const ITEMS_PER_PAGE = 10;

const Compras = () => {
  // --- ESTADOS DO COMPONENTE ---
  const [purchases, setPurchases] = useState([]); // Guarda a lista COMPLETA de compras vinda do Supabase.
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'purchase_date', direction: 'descending' });
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const notify = useNotify();
  
  // 3. Novo estado para controlar qual é a página atual.
  const [currentPage, setCurrentPage] = useState(1);


  // --- LÓGICA DE DADOS ---
  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_purchases_with_payment_status');
      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      notify.error(error.message || 'Não foi possível carregar as compras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Lógica de ordenação (já implementada)
  const sortedPurchases = useMemo(() => {
    let sortableItems = [...purchases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [purchases, sortConfig]);

  // 4. Lógica de Paginação.
  //    Usa-se o 'useMemo' para que o cálculo só seja refeito se a página ou a lista de compras mudar.
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    // 'slice' corta o array completo, devolvendo apenas os itens para a página atual.
    return sortedPurchases.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedPurchases]);


  // --- MANIPULADORES DE EVENTOS ---
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Volta para a primeira página ao reordenar
  };

  const handleSuccess = () => {
    fetchPurchases();
    setIsPurchaseModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  // --- CONFIGURAÇÃO DA TABELA ---
  const columns = [
    {
      header: 'Fornecedor / C. Custo',
      key: 'supplier_name', // A 'key' é usada pela lógica de ordenação
      sortable: true,
      Cell: ({ row }) => (
        <div>
          <strong>{row.supplier_name}</strong>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {row.cost_center_name || 'Não informado'}
          </div>
        </div>
      )
    },
    {
      header: 'Data',
      key: 'purchase_date',
      sortable: true,
      Cell: ({ row }) => new Date(row.purchase_date).toLocaleDateString()
    },
    { 
      header: 'Status Pagamento',
      key: 'balance',
      sortable: true,
      Cell: ({ row }) => <ProgressBar total={row.total_amount} paid={row.total_paid} />
    },
    {
      header: 'Ações',
      key: 'actions',
      sortable: false,
      Cell: ({ row }) => (
        <Button 
          icon={FaMoneyBillWave}
          onClick={() => openPaymentModal(row)}
          isIconOnly
        >
          Ver Pagamentos
        </Button>
      )
    },
  ];

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Compras</h1>
        <Button icon={FaPlus} onClick={() => setIsPurchaseModalOpen(true)}>Nova Compra</Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar compras...</p>
        ) : (
          // 5. O Card agora envolve a Tabela e a Paginação
          <>
            <Table 
              columns={columns} 
              data={currentTableData} // Passa para a tabela apenas os dados da página atual
              onSort={requestSort}
              sortConfig={sortConfig}
            />
            <Pagination 
              currentPage={currentPage}
              // Calcula o número total de páginas
              totalPages={Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE)}
              // A função que será chamada quando o utilizador clicar nos botões da paginação
              onPageChange={page => setCurrentPage(page)}
            />
          </>
        )}
      </Card>

      <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Registar Nova Compra">
        <PurchaseForm onSuccess={handleSuccess} />
      </Modal>

      {selectedPurchase && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Detalhes do Pagamento da Compra">
          <PurchasePaymentForm purchase={selectedPurchase} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Compras;
