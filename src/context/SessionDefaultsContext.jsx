// src/context/SessionDefaultsContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionDefaultsContext = createContext();

const getInitialState = () => {
  try {
    const item = window.localStorage.getItem('sessionDefaults');
    return item ? JSON.parse(item) : {};
  } catch (error) {
    console.error("Failed to parse session defaults from localStorage", error);
    return {};
  }
};

export const SessionDefaultsProvider = ({ children }) => {
  const [defaults, setDefaults] = useState(getInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem('sessionDefaults', JSON.stringify(defaults));
    } catch (error) {
      console.error("Failed to save session defaults to localStorage", error);
    }
  }, [defaults]);

  const updateDefault = (key, value) => {
    setDefaults(prev => ({ ...prev, [key]: value }));
  };

  const value = {
    sessionDefaults: defaults,
    updateDefault,
  };

  return (
    <SessionDefaultsContext.Provider value={value}>
      {children}
    </SessionDefaultsContext.Provider>
  );
};

export const useSessionDefaults = () => {
  return useContext(SessionDefaultsContext);
};
