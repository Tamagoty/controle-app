// src/context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

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
  const [activeTheme, setActiveTheme] = useState(defaultTheme);
  const [savedThemes, setSavedThemes] = useState([]);
  const { user } = useAuth();

  const applyTheme = useCallback((themeToApply) => {
    const root = document.documentElement;
    const finalTheme = { ...defaultTheme, ...(themeToApply || {}) };
    for (const key in finalTheme) {
      root.style.setProperty(key, finalTheme[key]);
    }
    setActiveTheme(finalTheme);
  }, []);

  // Efeito para carregar os temas do utilizador
  useEffect(() => {
    const fetchUserThemes = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('theme_settings')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          
          const userThemes = data?.theme_settings || [];
          setSavedThemes(userThemes);

          const lastActiveThemeId = localStorage.getItem(`activeTheme_${user.id}`);
          
          // CORREÇÃO: Verifica se o último tema ativo foi o padrão
          if (lastActiveThemeId === 'default') {
            applyTheme(defaultTheme);
          } else {
            const themeToLoad = userThemes.find(t => t.id === lastActiveThemeId);
            applyTheme(themeToLoad ? themeToLoad.settings : (userThemes[0]?.settings || defaultTheme));
          }
          
        } catch (err) {
          console.error("Falha ao buscar os temas do utilizador:", err);
          applyTheme(defaultTheme);
        }
      }
    };

    fetchUserThemes();
  }, [user, applyTheme]);

  const updateActiveTheme = (newThemeSettings) => {
    const newTheme = { ...activeTheme, ...newThemeSettings };
    applyTheme(newTheme);
  };

  const saveActiveTheme = async (themeName) => {
    if (user && themeName) {
      const newTheme = {
        id: uuidv4(),
        name: themeName,
        settings: activeTheme,
      };
      const newSavedThemes = [...savedThemes, newTheme];
      setSavedThemes(newSavedThemes);
      await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, theme_settings: newSavedThemes });
    }
  };

  const deleteTheme = async (themeId) => {
    if (user) {
        const newSavedThemes = savedThemes.filter(t => t.id !== themeId);
        setSavedThemes(newSavedThemes);
        await supabase
            .from('user_profiles')
            .upsert({ user_id: user.id, theme_settings: newSavedThemes });
        
        const lastActiveThemeId = localStorage.getItem(`activeTheme_${user.id}`);
        if(lastActiveThemeId === themeId) {
            localStorage.setItem(`activeTheme_${user.id}`, 'default');
            applyTheme(defaultTheme);
        }
    }
  };

  const loadTheme = (themeId) => {
    const themeToLoad = savedThemes.find(t => t.id === themeId);
    if (themeToLoad) {
        applyTheme(themeToLoad.settings);
        if (user) {
            localStorage.setItem(`activeTheme_${user.id}`, themeId);
        }
    }
  };

  const resetActiveTheme = () => {
    applyTheme(defaultTheme);
    if (user) {
        // CORREÇÃO: Em vez de remover, define o tema ativo como 'default'
        localStorage.setItem(`activeTheme_${user.id}`, 'default');
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, savedThemes, updateActiveTheme, saveActiveTheme, deleteTheme, loadTheme, resetActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
