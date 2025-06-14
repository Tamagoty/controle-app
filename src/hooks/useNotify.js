// src/hooks/useNotify.js

import { toast } from 'react-hot-toast';

/**
 * Hook personalizado para exibir notificações (toasts).
 * Abstrai a biblioteca 'react-hot-toast' para uso simplificado na aplicação.
 * * @returns {{
 * success: (message: string) => void,
 * error: (message: string) => void,
 * info: (message: string) => void,
 * loading: (message: string) => string,
 * dismiss: (toastId?: string) => void
 * }}
 */
export const useNotify = () => {
  /**
   * Exibe uma notificação de sucesso.
   * @param {string} message - A mensagem a ser exibida.
   */
  const success = (message) => {
    toast.success(message);
  };

  /**
   * Exibe uma notificação de erro.
   * @param {string} message - A mensagem a ser exibida.
   */
  const error = (message) => {
    toast.error(message);
  };

  /**
   * Exibe uma notificação de informação (customizada).
   * @param {string} message - A mensagem a ser exibida.
   */
  const info = (message) => {
    toast(message, {
      icon: 'ℹ️', // Ícone de informação
    });
  };

  /**
   * Exibe uma notificação de carregamento.
   * Geralmente usada antes de uma chamada de API.
   * @param {string} message - A mensagem a ser exibida.
   * @returns {string} O ID do toast, para que possa ser atualizado ou removido depois.
   */
  const loading = (message) => {
    return toast.loading(message);
  };

  /**
   * Remove um ou todos os toasts da tela.
   * @param {string} [toastId] - O ID do toast a ser removido. Se não for fornecido, remove todos.
   */
  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    loading,
    dismiss,
  };
};
