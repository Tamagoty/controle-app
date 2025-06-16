// src/components/ProtectedRoute.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

// Um componente simples de ecrã de carregamento para feedback visual
const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a', // Usando a cor de fundo do nosso tema
      color: '#e6e6e6', // Usando a cor de texto do nosso tema
      fontFamily: "'Inter', sans-serif"
    }}>
      <h1>A carregar sessão...</h1>
    </div>
  );
};


const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Enquanto a verificação inicial da sessão (após um F5) estiver a decorrer,
  // exibe um ecrã de carregamento em vez de uma tela preta.
  // Isto dá um feedback visual ao utilizador e ajuda a resolver problemas de 'timing'.
  if (loading) {
    return <LoadingScreen />;
  }

  // Após o carregamento, se não houver utilizador, redireciona para a página de login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se houver utilizador, renderiza a página solicitada.
  return <Outlet />;
};

export default ProtectedRoute;
