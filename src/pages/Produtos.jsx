// src/pages/Produtos.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // A nossa ponte com o Supabase
import Table from '../components/Table/Table';
import Card from '../components/Card/Card';
import { useNotify } from '../hooks/useNotify';

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    // Função assíncrona para buscar os produtos.
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Usamos o nosso cliente supabase para fazer uma query
        // à tabela 'products' e selecionar todas as colunas (*).
        const { data, error } = await supabase
          .from('products') // O nome da sua tabela de produtos no Supabase
          .select('*');

        if (error) {
          // Se houver um erro na chamada, lançamos o erro
          throw error;
        }

        // Se a chamada for bem-sucedida, atualizamos o estado com os dados
        setProducts(data);
      } catch (error) {
        // Se algo der errado, mostramos uma notificação de erro
        console.error('Erro ao buscar produtos:', error);
        notify.error('Não foi possível carregar os produtos.');
      } finally {
        // Independentemente do resultado, paramos o carregamento
        setLoading(false);
      }
    };

    fetchProducts();

  // A CORREÇÃO ESTÁ AQUI:
  // Deixamos o array de dependências vazio.
  // Isto garante que o efeito só roda UMA VEZ, quando o componente é montado.
  }, []); 

  // Definição das colunas para a nossa Tabela
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nome', accessor: 'name' },
    { header: 'Preço de Venda', accessor: 'sale_price' },
    // Adicione outras colunas que existam na sua tabela 'products'
  ];

  return (
    <div>
      <h1>Produtos</h1>
      <Card>
        {loading ? (
          <p>A carregar produtos...</p>
        ) : (
          <Table columns={columns} data={products} />
        )}
      </Card>
    </div>
  );
};

export default Produtos;
