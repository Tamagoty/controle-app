-- =================================================================
-- SCRIPT 15: FUNCIONALIDADE DO DASHBOARD DE SÓCIOS
-- Cria a função RPC necessária para buscar os dados agregados
-- e detalhados para o novo dashboard de sócios.
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    summary_data JSON;
    transactions_data JSONB;
    total_aportes NUMERIC;
    total_retiradas NUMERIC;
BEGIN
    -- Calcula os totais de aportes e retiradas para o sócio especificado
    SELECT
        COALESCE(SUM(CASE WHEN transaction_type = 'Aporte' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'Retirada' THEN amount ELSE 0 END), 0)
    INTO
        total_aportes,
        total_retiradas
    FROM
        public.partner_transactions
    WHERE
        partner_id = p_partner_id;

    -- Constrói o sumário
    summary_data := json_build_object(
        'total_aportes', total_aportes,
        'total_retiradas', total_retiradas,
        'saldo_atual', total_aportes - total_retiradas
    );

    -- Busca o histórico de transações
    SELECT
        jsonb_agg(
            json_build_object(
                'id', pt.id,
                'transaction_date', pt.transaction_date,
                'transaction_type', pt.transaction_type,
                'amount', pt.amount,
                'description', pt.description
            ) ORDER BY pt.transaction_date DESC
        )
    INTO
        transactions_data
    FROM
        public.partner_transactions pt
    WHERE
        pt.partner_id = p_partner_id;

    -- Retorna o JSON completo com o sumário e as transações
    RETURN json_build_object(
        'summary', summary_data,
        'transactions', COALESCE(transactions_data, '[]'::jsonb)
    );
END;
$$;
