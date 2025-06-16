// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserSession = async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      try {
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        if (error) throw error;

        setUserRole(roleData?.role || null);
      } catch (error) {
        console.error("Erro ao buscar papel do usuário:", error);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  };

 useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await loadUserSession(session);
    setLoading(false);
  };

  // Aguarda 300ms antes de iniciar — dá tempo para o Supabase restaurar a sessão
  const timeout = setTimeout(() => {
    init();
  }, 300);

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    loadUserSession(session);
  });

  return () => {
    clearTimeout(timeout);
    authListener.subscription.unsubscribe();
  };
}, []);

  const value = {
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.replace('/login');
    },
    user,
    role: userRole,
    loading,
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
