// src/pages/Configuracoes/ThemeSettings.jsx

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import styles from './ThemeSettings.module.css';

const ThemeSettings = () => {
  const { theme, updateTheme, resetTheme } = useTheme();

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    updateTheme({ [name]: value });
  };

  // Mapeia as variáveis do tema para rótulos amigáveis
  const themeOptions = [
    { label: 'Cor Primária da Ação', key: '--theme-primary' },
    { label: 'Cor Primária (Hover)', key: '--theme-primary-hover' },
    { label: 'Fundo Principal', key: '--theme-bg-primary' },
    { label: 'Fundo Secundário (Cards)', key: '--theme-bg-secondary' },
    { label: 'Fundo Terciário (Inputs)', key: '--theme-bg-tertiary' },
    { label: 'Texto Principal', key: '--theme-text-primary' },
    { label: 'Texto Secundário', key: '--theme-text-secondary' },
    { label: 'Bordas e Divisórias', key: '--theme-border' },
  ];

  return (
    <div>
      <h1>Personalização de Tema</h1>
      <p>Altere as cores da aplicação para corresponder à identidade da sua marca. As alterações são guardadas automaticamente no seu navegador.</p>
      
      <Card>
        <div className={styles.themeGrid}>
          {themeOptions.map(option => (
            <div key={option.key} className={styles.colorPickerGroup}>
              <label htmlFor={option.key}>{option.label}</label>
              <input
                type="color"
                id={option.key}
                name={option.key}
                value={theme[option.key]}
                onChange={handleColorChange}
                className={styles.colorInput}
              />
            </div>
          ))}
        </div>
        <div className={styles.actions}>
            <Button onClick={resetTheme} variant="ghost">Restaurar Padrão</Button>
        </div>
      </Card>
    </div>
  );
};

export default ThemeSettings;
