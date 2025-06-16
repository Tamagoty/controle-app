// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // <-- ESTADO CRUCIAL: Começa como true!

  useEffect(() => {
    // O onAuthStateChange é a única fonte da verdade. Ele é acionado na carga inicial (F5)
    // e em qualquer mudança de estado, garantindo consistência.
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
            
            // Se não conseguir obter o papel, lança um erro para o bloco catch.
            if (error) throw error;

            setUserRole(roleData?.role || null);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("AuthContext Error: Falha ao validar a sessão.", error);
          setUser(null);
          setUserRole(null);
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
  }, []);

  const value = {
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
        await supabase.auth.signOut();
        // Força um recarregamento completo para a página de login,
        // limpando qualquer estado inconsistente do navegador.
        window.location.replace('/login');
    },
    user,
    role: userRole,
    loading, // <-- Exporta o estado de carregamento para as rotas.
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
