// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Compras from './pages/Compras';
import Produtos from './pages/Produtos'; // Importamos a nova página
import Pessoas from './pages/Pessoas'; // Importamos a nova página

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-text-primary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'var(--color-text-primary)',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="compras" element={<Compras />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="pessoas" element={<Pessoas />} /> {/* <-- NOVA ROTA */}
        </Route>
      </Routes>
    </>
  );
}

export default App;
