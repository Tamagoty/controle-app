// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const defaultProfile = {
  role: null,
  name: null, // Novo campo para o nome
  avatar_url: null,
  media_settings: { image_quality: 0.6, max_size_mb: 1, max_width_or_height: 1920 }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  const loadUserSession = useCallback(async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      try {
        // Chama a nova função otimizada para buscar todos os dados do perfil
        const { data, error } = await supabase.rpc('get_full_user_profile', {
          p_user_id: currentUser.id
        });

        if (error) throw error;

        setProfile({
          role: data.role || null,
          name: data.name || null,
          avatar_url: data.avatar_url || null,
          media_settings: { ...defaultProfile.media_settings, ...data.media_settings }
        });

      } catch (error) {
        console.error("Erro ao buscar perfil do utilizador:", error);
        setProfile(defaultProfile);
      }
    } else {
      setProfile(defaultProfile);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await loadUserSession(session);
      setLoading(false);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserSession]);

  const value = {
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.replace('/login');
    },
    user,
    profile,
    loading,
    refreshUserProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await loadUserSession(session);
    },
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

export default AuthProvider;
