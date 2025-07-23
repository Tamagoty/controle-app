-- =================================================================
-- SCRIPT 31: FUNCIONALIDADE DE ANEXOS EM PAGAMENTOS INDIVIDUAIS
-- Altera a tabela de anexos para permitir a associação de ficheiros
-- a registos de pagamento específicos.
-- =================================================================

-- 1. ADICIONAR AS NOVAS COLUNAS DE REFERÊNCIA À TABELA 'attachments'
-- Estas colunas irão ligar um anexo a um pagamento específico.
ALTER TABLE public.attachments
ADD COLUMN IF NOT EXISTS sale_payment_id UUID REFERENCES public.sale_payments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS purchase_payment_id UUID REFERENCES public.purchase_payments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS expense_payment_id UUID REFERENCES public.expense_payments(id) ON DELETE CASCADE;


-- 2. APAGAR A REGRA DE VERIFICAÇÃO ANTIGA E INCORRETA
-- Vamos substituí-la por uma regra mais completa.
ALTER TABLE public.attachments
DROP CONSTRAINT IF EXISTS attachment_type_check;


-- 3. ADICIONAR A NOVA REGRA DE VERIFICAÇÃO FINAL
-- Garante que um anexo está ligado a APENAS UM tipo de registo.
ALTER TABLE public.attachments
ADD CONSTRAINT attachment_type_check
CHECK (
  (
    (CASE WHEN purchase_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN sale_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN sale_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN purchase_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN expense_payment_id IS NOT NULL THEN 1 ELSE 0 END)
  ) = 1
);
