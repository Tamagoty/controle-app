// src/components/ProtectedRoute.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Se não houver utilizador logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se houver utilizador, renderiza o conteúdo da rota (as nossas páginas)
  return <Outlet />;
};

export default ProtectedRoute;
