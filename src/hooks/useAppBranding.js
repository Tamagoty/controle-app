// src/hooks/useAppBranding.js

import { useEffect, useState } from 'react';

// Lê as variáveis de ambiente, com valores padrão caso não sejam definidas.
const appNameFromEnv = import.meta.env.VITE_APP_NAME || 'Controle App';
const faviconUrlFromEnv = import.meta.env.VITE_FAVICON_URL || '/favicon.ico';
const logoUrlFromEnv = import.meta.env.VITE_APP_LOGO_URL || null; // Será null se não for definido

export const useAppBranding = () => {
  const [appName] = useState(appNameFromEnv);
  const [logoUrl] = useState(logoUrlFromEnv);

  useEffect(() => {
    document.title = appName;

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrlFromEnv;
  }, [appName]);

  // Retorna o nome e o logo da aplicação
  return { appName, logoUrl };
};