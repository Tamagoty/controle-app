// src/pages/Produtos.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
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
  const notify = useNotify();

  // A função para buscar os dados. Não precisa de 'useCallback' neste cenário.
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
    // A CORREÇÃO: Usar um array de dependências vazio '[]'.
    // Isto garante que o efeito só roda UMA VEZ quando a página carrega,
    // quebrando o loop infinito de requisições.
  }, []);

  const handleNewProductSuccess = (newProduct) => {
    setProducts(currentProducts => [newProduct, ...currentProducts]);
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Preço de Venda', accessor: 'sale_price' },
    { header: 'Descrição', accessor: 'description' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Produtos</h1>
        <Button onClick={() => setIsModalOpen(true)}>
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
        onClose={() => setIsModalOpen(false)} 
        title="Adicionar Novo Produto"
      >
        <ProductForm onSuccess={handleNewProductSuccess} />
      </Modal>
    </div>
  );
};

export default Produtos;
