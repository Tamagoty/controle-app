// src/hooks/useNotify.js

import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook personalizado para exibir notificações (toasts).
 * Abstrai a biblioteca 'react-hot-toast' para uso simplificado na aplicação.
 * @returns {{
 * success: (message: string) => void,
 * error: (message: string) => void,
 * info: (message: string) => void,
 * loading: (message: string) => string,
 * dismiss: (toastId?: string) => void
 * }}
 */
export const useNotify = () => {
  // Usamos o useMemo com um array de dependências vazio para garantir
  // que o objeto com as funções de notificação seja criado apenas uma vez.
  // Isso torna o retorno do hook "estável", resolvendo o problema do loop infinito
  // e satisfazendo a regra 'exhaustive-deps' do ESLint.
  const notificationFunctions = useMemo(() => ({
    /**
     * Exibe uma notificação de sucesso.
     * @param {string} message - A mensagem a ser exibida.
     */
    success: (message) => {
      toast.success(message);
    },

    /**
     * Exibe uma notificação de erro.
     * @param {string} message - A mensagem a ser exibida.
     */
    error: (message) => {
      toast.error(message);
    },

    /**
     * Exibe uma notificação de informação (customizada).
     * @param {string} message - A mensagem a ser exibida.
     */
    info: (message) => {
      toast(message, {
        icon: 'ℹ️',
      });
    },

    /**
     * Exibe uma notificação de carregamento.
     * @param {string} message - A mensagem a ser exibida.
     * @returns {string} O ID do toast, para que possa ser atualizado ou removido depois.
     */
    loading: (message) => {
      return toast.loading(message);
    },

    /**
     * Remove um ou todos os toasts da tela.
     * @param {string} [toastId] - O ID do toast a ser removido. Se não for fornecido, remove todos.
     */
    dismiss: (toastId) => {
      toast.dismiss(toastId);
    },
  }), []);

  return notificationFunctions;
};
