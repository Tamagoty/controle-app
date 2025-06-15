// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esta função de logout é a nossa "arma secreta" para forçar um estado limpo.
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    // Força um recarregamento completo para a página de login.
    // Esta é a maneira mais eficaz de limpar qualquer estado inconsistente do navegador.
    window.location.replace('/login');
  };

  useEffect(() => {
    // A abordagem final e mais robusta.
    // O 'onAuthStateChange' é a única fonte da verdade e agora inclui
    // um tratamento de erros completo para garantir que a aplicação nunca fique "presa".
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            // Se existe um utilizador, busca o seu papel.
            const { data: roleData, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            // Se houver um erro ao buscar o papel, o erro será capturado pelo 'catch'.
            if (error) throw error;
            
            setUser(session.user);
            setUserRole(roleData?.role || null);
          } else {
            // Se não há sessão, limpa os dados.
            setUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("AuthContext Error: Falha ao validar a sessão. A forçar logout.", error);
          // Se qualquer erro ocorrer, força o logout para evitar a "tela preta".
          await handleSignOut();
        } finally {
          // A cláusula 'finally' GARANTE que o loading seja definido como falso,
          // permitindo que a aplicação seja renderizada, mesmo que ocorra um erro.
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // O array de dependências vazio é crucial.

  const value = {
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: handleSignOut, // Usa a nossa função de logout robusta.
    user,
    role: userRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
