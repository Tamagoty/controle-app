// src/components/ProtectedRoute.jsx

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';

// Um componente simples de ecrã de carregamento para feedback visual
const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#e6e6e6',
      fontFamily: "'Inter', sans-serif"
    }}>
      <h1>A carregar sessão...</h1>
    </div>
  );
};

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Esta é a nova abordagem, mais robusta.
  // Usamos um 'useEffect' para observar as mudanças no estado de 'loading' e 'user'.
  useEffect(() => {
    // Só tomamos uma decisão DEPOIS que o carregamento inicial termina.
    if (!loading) {
      // Se, após o carregamento, não houver utilizador, NÓS ORDENAMOS a navegação.
      if (!user) {
        navigate('/login', { replace: true });
      }
    }
  }, [loading, user, navigate]); // Este efeito corre sempre que estes valores mudam.

  // 1. Enquanto a sessão está sendo verificada, mostramos um ecrã de carregamento.
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Se houver um utilizador, renderizamos a página.
  //    Se não houver, renderizamos 'null' por um instante, enquanto o 'useEffect' acima
  //    faz o seu trabalho de redirecionar. Isto evita a "tela preta".
  return user ? <Outlet /> : null;
};

export default ProtectedRoute;
