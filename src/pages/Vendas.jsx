// src/pages/Vendas.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/Card/Card';
import Table from '../components/Table/Table';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import SaleForm from '../components/SaleForm/SaleForm';
import SalePaymentForm from '../components/SalePaymentForm/SalePaymentForm';
import { useNotify } from '../hooks/useNotify';

const Vendas = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const notify = useNotify();

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Chamamos a nossa nova função RPC para obter os dados já calculados
      const { data, error } = await supabase.rpc('get_sales_with_payment_status');

      if (error) throw error;

      // Opcional: Formatar os valores para exibição
      const formattedData = data.map(s => ({
        ...s,
        sale_date: new Date(s.sale_date).toLocaleDateString(),
        total_amount_formatted: `R$ ${s.total_amount.toFixed(2)}`,
        total_paid_formatted: `R$ ${s.total_paid.toFixed(2)}`,
        balance_formatted: `R$ ${s.balance.toFixed(2)}`,
      }));
      setSales(formattedData);

    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      notify.error(error.message || 'Não foi possível carregar as vendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleNewSaleSuccess = () => {
    fetchSales();
    setIsSaleModalOpen(false);
  };
  
  const handlePaymentSuccess = () => {
    fetchSales();
    setIsPaymentModalOpen(false);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  // As colunas da tabela agora incluem o estado de pagamento e um botão de ações
  const columns = [
    { header: 'Data', accessor: 'sale_date' },
    { header: 'Cliente', accessor: 'client_name' },
    { header: 'Valor Total', accessor: 'total_amount_formatted' },
    { header: 'Valor Pago', accessor: 'total_paid_formatted' },
    { header: 'Saldo', accessor: 'balance_formatted' },
    { 
      header: 'Ações',
      accessor: 'actions',
      // Renderizamos um botão para cada linha
      Cell: ({ row }) => (
        <Button 
          variant="secondary" 
          onClick={() => openPaymentModal(row)}
          disabled={row.balance <= 0}
        >
          Pagar
        </Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Vendas</h1>
        <Button onClick={() => setIsSaleModalOpen(true)}>
          Nova Venda
        </Button>
      </div>
      
      <Card>
        {loading ? (
          <p>A carregar vendas...</p>
        ) : (
          <Table columns={columns} data={sales} />
        )}
      </Card>

      {/* Modal para criar uma nova venda */}
      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Registar Nova Venda">
        <SaleForm onSuccess={handleNewSaleSuccess} />
      </Modal>

      {/* Modal para registar um pagamento */}
      {selectedSale && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registar Pagamento">
          <SalePaymentForm sale={selectedSale} onSuccess={handlePaymentSuccess} />
        </Modal>
      )}
    </div>
  );
};

export default Vendas;
