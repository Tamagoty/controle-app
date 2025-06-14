// src/pages/Produtos.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaEdit } from 'react-icons/fa';
import Table from '../components/Table/Table';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import ProductForm from '../components/ProductForm/ProductForm';
import { useNotify } from '../hooks/useNotify';

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const notify = useNotify();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data);
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

  const columns = [
    { header: 'Nome', key: 'name', accessor: 'name', sortable: true },
    { header: 'Preço de Venda', key: 'sale_price', accessor: 'sale_price', sortable: true },
    { header: 'Descrição', key: 'description', accessor: 'description', sortable: false },
    {
      header: 'Ações',
      key: 'actions',
      sortable: false,
      Cell: ({ row }) => (
        <Button icon={FaEdit} isIconOnly onClick={() => handleOpenModal(row)}>
          Editar
        </Button>
      )
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
        {loading ? (
          <p>A carregar produtos...</p>
        ) : (
          <Table columns={columns} data={products} />
        )}
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
