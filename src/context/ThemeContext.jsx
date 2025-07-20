// src/context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext'; // Precisamos de saber quem é o utilizador

const defaultTheme = {
  '--theme-bg-primary': '#1a1a1a',
  '--theme-bg-secondary': '#2a2a2a',
  '--theme-bg-tertiary': '#3a3a3a',
  '--theme-text-primary': '#e6e6e6',
  '--theme-text-secondary': '#a0a0a0',
  '--theme-primary': '#6a11cb',
  '--theme-primary-hover': '#8338ec',
  '--theme-border': '#444444',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const { user } = useAuth(); // Obtém o utilizador do contexto de autenticação

  // Função para aplicar o tema ao DOM
  const applyTheme = useCallback((themeToApply) => {
    const root = document.documentElement;
    for (const key in themeToApply) {
      root.style.setProperty(key, themeToApply[key]);
    }
    setTheme(themeToApply);
  }, []);

  // Efeito para carregar o tema do utilizador quando ele faz login
  useEffect(() => {
    const fetchUserTheme = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('theme_settings')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = 'not found'
            throw error;
          }
          
          if (data && data.theme_settings) {
            applyTheme({ ...defaultTheme, ...data.theme_settings });
          } else {
            applyTheme(defaultTheme); // Se não houver tema guardado, aplica o padrão
          }
        } catch (err) {
          console.error("Falha ao buscar o tema do utilizador:", err);
          applyTheme(defaultTheme); // Em caso de erro, aplica o padrão
        }
      }
    };

    fetchUserTheme();
  }, [user, applyTheme]);

  // Função para atualizar e guardar o tema
  const updateTheme = async (newThemeSettings) => {
    const newTheme = { ...theme, ...newThemeSettings };
    applyTheme(newTheme);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({ user_id: user.id, theme_settings: newTheme });
        if (error) throw error;
      } catch (err) {
        console.error("Falha ao guardar o tema do utilizador:", err);
      }
    }
  };

  // Função para restaurar o tema padrão
  const resetTheme = () => {
    updateTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
