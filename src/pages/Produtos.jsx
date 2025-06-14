// src/pages/Produtos.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaEdit } from 'react-icons/fa';
import Table from '../components/Table/Table';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import ProductForm from '../components/ProductForm/ProductForm';
import ToggleSwitch from '../components/ToggleSwitch/ToggleSwitch';
import { useNotify } from '../hooks/useNotify';
import styles from './Produtos.module.css';

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const notify = useNotify();

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

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    fetchProducts();
    handleCloseModal();
  };
  
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const columns = [
    {
      header: 'Produto',
      key: 'name',
      sortable: true,
      Cell: ({ row }) => (
        <div>
          <strong>{row.name}</strong>
          <div className={styles.subtext}>{row.category_name || 'Sem categoria'}</div>
        </div>
      )
    },
    {
      header: 'Descrição',
      key: 'description',
      Cell: ({ row }) => <p className={styles.descriptionCell}>{row.description}</p>
    },
    {
      header: 'Preços (C/V)',
      key: 'sale_price',
      sortable: true,
      Cell: ({ row }) => (
        <div>
          <strong>{formatCurrency(row.sale_price)}</strong>
          <div className={styles.subtext}>Custo: {formatCurrency(row.purchase_price)}</div>
        </div>
      )
    },
    {
      header: 'Tipo / Un.',
      key: 'product_type',
      sortable: true,
      Cell: ({ row }) => (
        <div>
          <strong>{row.product_type}</strong>
          <div className={styles.subtext}>{row.unit_of_measure}</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'is_active',
      sortable: true,
      Cell: ({ row }) => <ToggleSwitch checked={row.is_active} onChange={(status) => handleStatusChange(row.id, status)} />
    },
    {
      header: 'Ações',
      key: 'actions',
      Cell: ({ row }) => <Button icon={FaEdit} isIconOnly onClick={() => handleOpenModal(row)}>Editar</Button>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Produtos</h1>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>
          Novo Produto
        </Button>
      </div>

      <Card>
        {loading ? <p>A carregar produtos...</p> : <Table columns={columns} data={products} />}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
      >
        <ProductForm onSuccess={handleSuccess} productToEdit={editingProduct} />
      </Modal>
    </div>
  );
};

export default Produtos;
