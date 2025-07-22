-- =================================================================
-- SCRIPT 26: CORREÇÃO DA TABELA DE ANEXOS PARA VENDAS
-- Adiciona a coluna 'sale_id' à tabela de anexos e corrige a
-- regra de verificação para permitir a associação com vendas.
--
-- Este script é seguro para ser executado em produção.
-- =================================================================

-- 1. ADICIONAR A COLUNA 'sale_id' À TABELA 'attachments'
-- A coluna é uma referência à tabela 'sales' e será apagada em cascata.
ALTER TABLE public.attachments
ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE;


-- 2. APAGAR A REGRA DE VERIFICAÇÃO ANTIGA E INCORRETA
ALTER TABLE public.attachments
DROP CONSTRAINT IF EXISTS purchase_or_expense_check;


-- 3. ADICIONAR A NOVA REGRA DE VERIFICAÇÃO CORRETA
-- Garante que um anexo está ligado a uma compra, OU a uma despesa, OU a uma venda, mas apenas a um deles.
ALTER TABLE public.attachments
ADD CONSTRAINT attachment_type_check
CHECK (
    (purchase_id IS NOT NULL AND expense_id IS NULL AND sale_id IS NULL) OR
    (purchase_id IS NULL AND expense_id IS NOT NULL AND sale_id IS NULL) OR
    (purchase_id IS NULL AND expense_id IS NULL AND sale_id IS NOT NULL)
);
