-- =================================================================
-- SCRIPT PARA CRIAR A FUNÇÃO get_partner_transactions
-- =================================================================
-- Este script cria a função RPC necessária para a página de Transações de Sócios.

CREATE OR REPLACE FUNCTION public.get_partner_transactions()
RETURNS TABLE(
    id UUID,
    transaction_date TIMESTAMPTZ,
    partner_name TEXT,
    transaction_type TEXT,
    amount NUMERIC,
    description TEXT
)
LANGUAGE sql
STABLE
AS $$
SELECT
    pt.id,
    pt.transaction_date,
    e.name as partner_name,
    pt.transaction_type,
    pt.amount,
    pt.description
FROM
    public.partner_transactions pt
    JOIN public.partners p ON pt.partner_id = p.id
    JOIN public.entities e ON p.entity_id = e.id
ORDER BY
    pt.transaction_date DESC;
$$;