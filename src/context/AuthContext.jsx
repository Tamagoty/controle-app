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
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      await loadUserSession(session);
      setLoading(false);
    }
  );

  // fallback: se nada acontecer em 2s, libera o app mesmo assim
  const timeout = setTimeout(() => setLoading(false), 2000);

  return () => {
    authListener.subscription.unsubscribe();
    clearTimeout(timeout);
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
