// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const defaultProfile = {
  role: null,
  avatar_url: null,
  media_settings: { image_quality: 0.6, max_size_mb: 1, max_width_or_height: 1920 }
};

// O componente agora não é exportado diretamente aqui
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  const loadUserSession = useCallback(async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      try {
        const [roleResponse, profileResponse] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', currentUser.id).single(),
          supabase.from('user_profiles').select('avatar_url, media_settings').eq('user_id', currentUser.id).single()
        ]);

        const { data: roleData, error: roleError } = roleResponse;
        const { data: profileData, error: profileError } = profileResponse;

        if (roleError && roleError.code !== 'PGRST116') throw roleError;
        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        setProfile({
          role: roleData?.role || null,
          avatar_url: profileData?.avatar_url || null,
          media_settings: { ...defaultProfile.media_settings, ...profileData?.media_settings }
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

// Adicionamos o AuthProvider como a exportação default do ficheiro
export default AuthProvider;
