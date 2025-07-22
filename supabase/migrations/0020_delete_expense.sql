-- =================================================================
-- SCRIPT 20: FUNÇÃO PARA APAGAR DESPESAS DE FORMA SEGURA
-- Adiciona a função RPC para apagar despesas gerais, garantindo
-- que os pagamentos e anexos associados sejam removidos.
-- =================================================================

CREATE OR REPLACE FUNCTION public.delete_expense(p_expense_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Apaga a despesa. Graças à configuração "ON DELETE CASCADE"
    -- nas tabelas 'expense_payments' e 'attachments', todos os registos
    -- associados a esta despesa serão apagados automaticamente.
    DELETE FROM public.general_expenses WHERE id = p_expense_id;
END;
$$;
