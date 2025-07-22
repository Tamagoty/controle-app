// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AuthProvider from './context/AuthContext'; // <-- CORREÇÃO: Importa como default
import { ThemeProvider } from './context/ThemeContext';
import { SessionDefaultsProvider } from './context/SessionDefaultsContext';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SessionDefaultsProvider>
            <App />
          </SessionDefaultsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
