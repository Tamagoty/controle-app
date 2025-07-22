// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AuthProvider from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionDefaultsProvider } from './context/SessionDefaultsContext'; // <-- NOVO
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          {/* Envolvemos a aplicação com o novo Provider */}
          <SessionDefaultsProvider>
            <App />
          </SessionDefaultsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
