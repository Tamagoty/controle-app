// src/App.jsx - VERSÃO REVERTIDA

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
import CostCenters from './pages/Financeiro/CostCenters'; // <-- Importa a nova página
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
          <Route path="financeiro/centros-de-custo" element={<CostCenters />} /> {/* <-- Nova rota */}
          <Route path="capital/socios" element={<Socios />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
