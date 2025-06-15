// src/context/AuthContext.jsx - VERSÃO DE PAUSA

import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // Simulamos um utilizador 'admin' para que a aplicação continue a funcionar
  // com todas as permissões durante o desenvolvimento.
  const value = {
    user: { id: 'dummy-user-id', email: 'admin@dev.com' },
    role: 'admin',
    signIn: () => console.log("SignIn desativado temporariamente."),
    signOut: () => console.log("SignOut desativado temporariamente."),
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
