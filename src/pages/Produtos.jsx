// src/pages/Produtos.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext'; // <-- Importa o nosso hook de autenticação
import { FaPlus, FaEdit, FaWarehouse } from 'react-icons/fa';
import Table from '../components/Table/Table';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import ProductForm from '../components/ProductForm/ProductForm';
import StockAdjustmentForm from '../components/StockAdjustmentForm/StockAdjustmentForm';
import ToggleSwitch from '../components/ToggleSwitch/ToggleSwitch';
import { useNotify } from '../hooks/useNotify';
import styles from './Produtos.module.css';

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState(null);
  const notify = useNotify();
  const { role } = useAuth(); // <-- Obtém o papel do utilizador logado

  const canManage = role === 'admin' || role === 'gestor'; // <-- Verifica se tem permissão

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_products_with_details');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      notify.error('Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await supabase.from('products').update({ is_active: newStatus }).eq('id', productId);
      setProducts(current => current.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
      notify.success('Status atualizado!');
    } catch (error) {
      notify.error('Falha ao atualizar o status.');
    }
  };

  const openFormModal = (product = null) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const openStockModal = (product) => {
    setAdjustingStockProduct(product);
    setIsStockModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsStockModalOpen(false);
    setEditingProduct(null);
    setAdjustingStockProduct(null);
  };

  const handleSuccess = () => {
    fetchProducts();
    handleCloseModals();
  };
  
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const columns = [
    {
      header: 'Produto',
      key: 'name',
      Cell: ({ row }) => (
        <div>
          <strong>{row.name}</strong>
          <div className={styles.subtext}>{row.category_name || 'Sem categoria'}</div>
        </div>
      )
    },
    {
      header: 'Stock',
      key: 'stock_quantity',
      Cell: ({ row }) => (
        <div className={styles.stockCell}>
          <span className={row.stock_quantity <= 0 ? styles.stockEmpty : ''}>
            {row.stock_quantity}
          </span>
          <span className={styles.subtext}>{row.unit_of_measure}</span>
        </div>
      )
    },
    {
      header: 'Preços (C/V)',
      key: 'sale_price',
      Cell: ({ row }) => (
        <div>
          <strong>{formatCurrency(row.sale_price)}</strong>
          <div className={styles.subtext}>Custo: {formatCurrency(row.purchase_price)}</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'is_active',
      Cell: ({ row }) => <ToggleSwitch checked={row.is_active} onChange={(status) => handleStatusChange(row.id, status)} disabled={!canManage} />
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => (
        // Renderiza os botões apenas se o utilizador tiver permissão
        canManage && (
          <div className={styles.actionsCell}>
              <Button icon={FaWarehouse} isIconOnly onClick={() => openStockModal(row)}>Ajustar Stock</Button>
              <Button icon={FaEdit} isIconOnly onClick={() => openFormModal(row)}>Editar</Button>
          </div>
        )
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Produtos</h1>
        {/* Renderiza o botão "Novo Produto" apenas se tiver permissão */}
        {canManage && (
          <Button icon={FaPlus} onClick={() => openFormModal()}>
            Novo Produto
          </Button>
        )}
      </div>

      <Card>
        {loading ? <p>A carregar produtos...</p> : <Table columns={columns} data={products} />}
      </Card>

      {canManage && (
        <>
          <Modal 
            isOpen={isFormModalOpen} 
            onClose={handleCloseModals} 
            title={editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
          >
            <ProductForm onSuccess={handleSuccess} productToEdit={editingProduct} />
          </Modal>

          {adjustingStockProduct && (
            <Modal
                isOpen={isStockModalOpen}
                onClose={handleCloseModals}
                title="Ajuste Manual de Stock"
            >
                <StockAdjustmentForm product={adjustingStockProduct} onSuccess={handleSuccess} />
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default Produtos;
