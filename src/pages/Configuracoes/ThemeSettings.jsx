// src/pages/Configuracoes/ThemeSettings.jsx

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import styles from './ThemeSettings.module.css';
import { FaSave, FaPalette, FaTrash, FaPlus } from 'react-icons/fa';

// Componente para a pré-visualização do tema
const ThemePreview = ({ theme }) => {
  // CORREÇÃO: Garante que o tema e as suas propriedades existem antes de renderizar
  const primaryColor = theme && theme['--theme-primary'] ? theme['--theme-primary'] : 'transparent';
  const secondaryColor = theme && theme['--theme-bg-secondary'] ? theme['--theme-bg-secondary'] : 'transparent';
  const textColor = theme && theme['--theme-text-primary'] ? theme['--theme-text-primary'] : 'transparent';

  return (
    <div className={styles.preview}>
      <div style={{ backgroundColor: primaryColor }} />
      <div style={{ backgroundColor: secondaryColor }} />
      <div style={{ backgroundColor: textColor }} />
    </div>
  );
};

const ThemeSettings = () => {
  const { activeTheme, savedThemes, updateActiveTheme, saveActiveTheme, deleteTheme, loadTheme, resetActiveTheme } = useTheme();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    updateActiveTheme({ [name]: value });
  };

  const handleSaveTheme = () => {
    if (newThemeName.trim()) {
        saveActiveTheme(newThemeName.trim());
        setIsSaveModalOpen(false);
        setNewThemeName('');
    }
  };

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
      <h1>Personalização de Aparência</h1>
      <p>Altere as cores do tema ativo abaixo e guarde as suas predefinições personalizadas.</p>
      
      <Card>
        <div className={styles.activeThemeHeader}>
            <h2 className={styles.sectionTitle}>Editor de Tema Ativo</h2>
            <div>
                <Button onClick={resetActiveTheme} variant="ghost" icon={FaPalette}>Restaurar Padrão</Button>
                <Button onClick={() => setIsSaveModalOpen(true)} icon={FaPlus}>Guardar Tema Ativo</Button>
            </div>
        </div>
        <div className={styles.themeGrid}>
          {themeOptions.map(option => (
            <div key={option.key} className={styles.colorPickerGroup}>
              <label htmlFor={option.key}>{option.label}</label>
              <input
                type="color"
                id={option.key}
                name={option.key}
                // CORREÇÃO: Garante que activeTheme existe antes de aceder às suas propriedades
                value={activeTheme ? activeTheme[option.key] : '#000000'}
                onChange={handleColorChange}
                className={styles.colorInput}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Meus Temas Guardados</h2>
        {savedThemes.length > 0 ? (
            <div className={styles.savedThemesGrid}>
            {/* CORREÇÃO: Adicionada a 'key' única ao elemento pai do map */}
            {savedThemes.map((theme) => (
                <div key={theme.id} className={styles.themeSlot}>
                <div className={styles.slotHeader}>
                    <strong>{theme.name}</strong>
                    <ThemePreview theme={theme.settings} />
                </div>
                <div className={styles.slotActions}>
                    <Button variant="ghost" onClick={() => loadTheme(theme.id)}>Ativar</Button>
                    <Button variant="danger" icon={FaTrash} isIconOnly onClick={() => deleteTheme(theme.id)}>Apagar</Button>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <p>Nenhum tema guardado. Altere o tema acima e clique em "Guardar Tema Ativo".</p>
        )}
      </Card>

      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title="Guardar Novo Tema">
        <div className={styles.modalForm}>
            <label htmlFor="themeName">Nome do Tema</label>
            <input 
                id="themeName"
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Ex: Tema Azul Escuro"
            />
            <div className={styles.modalActions}>
                <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>Cancelar</Button>
                <Button icon={FaSave} onClick={handleSaveTheme}>Guardar</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default ThemeSettings;
