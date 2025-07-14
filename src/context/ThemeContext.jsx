// src/context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define as cores padrão do tema escuro
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
  // Tenta carregar o tema do localStorage, ou usa o padrão se não houver.
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('app-theme');
      return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return defaultTheme;
    }
  });

  // Este efeito aplica as cores do tema ao documento e guarda no localStorage sempre que o tema muda.
  useEffect(() => {
    const root = document.documentElement;
    for (const key in theme) {
      root.style.setProperty(key, theme[key]);
    }
    localStorage.setItem('app-theme', JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (newTheme) => {
    setTheme(prevTheme => ({ ...prevTheme, ...newTheme }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
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
