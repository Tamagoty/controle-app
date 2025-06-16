// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esta função de logout robusta força uma limpeza completa no navegador.
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    // Força um recarregamento para a página de login, limpando qualquer estado inconsistente.
    window.location.replace('/login');
  };

  useEffect(() => {
    // O 'onAuthStateChange' é a única fonte da verdade. Ele é acionado
    // na carga inicial (F5) e em qualquer mudança de estado.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const currentUser = session?.user;
          setUser(currentUser ?? null);

          if (currentUser) {
            const { data: roleData, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', currentUser.id)
              .single();
            
            // Se não conseguir obter o papel, lança um erro para forçar o logout.
            // Isto impede que um utilizador fique logado sem um papel válido.
            if (error) throw error;

            setUserRole(roleData?.role || null);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("AuthContext Error: Falha ao validar sessão. A forçar logout.", error);
          // Se qualquer erro ocorrer, força o logout para evitar a "tela preta".
          await handleSignOut();
        } finally {
          // A cláusula 'finally' GARANTE que o loading seja definido como falso.
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: handleSignOut,
    user,
    role: userRole,
    loading, // Exporta o estado de carregamento para as rotas
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
