// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Compras from './pages/Compras';
import Produtos from './pages/Produtos';
import Pessoas from './pages/Pessoas';
import DespesasGerais from './pages/Financeiro/DespesasGerais';
import Comissoes from './pages/Financeiro/Comissoes';
import CostCenters from './pages/Financeiro/CostCenters';
import ContasAReceber from './pages/Financeiro/ContasAReceber';
import ContasAPagar from './pages/Financeiro/ContasAPagar'; // <-- Importa a nova página
import RelatorioFinanceiro from './pages/Relatorios/RelatorioFinanceiro';
import Socios from './pages/Capital/Socios';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ /* ... */ }}/>
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="compras" element={<Compras />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="pessoas" element={<Pessoas />} />
          <Route path="financeiro/despesas" element={<DespesasGerais />} />
          <Route path="financeiro/comissoes" element={<Comissoes />} />
          <Route path="financeiro/centros-de-custo" element={<CostCenters />} />
          <Route path="financeiro/contas-a-receber" element={<ContasAReceber />} />
          <Route path="financeiro/contas-a-pagar" element={<ContasAPagar />} /> {/* <-- Nova rota */}
          <Route path="relatorios/financeiro" element={<RelatorioFinanceiro />} />
          <Route path="capital/socios" element={<Socios />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
