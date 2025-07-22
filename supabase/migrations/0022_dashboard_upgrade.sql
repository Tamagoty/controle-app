-- =================================================================
-- SCRIPT 22: MELHORIA COMPLETA DO DASHBOARD
-- Cria uma nova função RPC otimizada para buscar todos os dados
-- necessários para o novo dashboard, tanto mensais como gerais.
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_main_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    -- Variáveis para o resumo do Mês Atual
    monthly_sales NUMERIC;
    monthly_purchases NUMERIC;
    monthly_expenses NUMERIC;
    monthly_balance NUMERIC;

    -- Variáveis para o resumo Geral (total)
    overall_sales NUMERIC;
    overall_purchases NUMERIC;
    overall_expenses NUMERIC;
    overall_balance NUMERIC;
BEGIN
    -- --- CÁLCULOS PARA O MÊS ATUAL ---
    SELECT COALESCE(SUM(total_amount), 0) INTO monthly_sales FROM public.sales WHERE sale_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(total_amount), 0) INTO monthly_purchases FROM public.purchases WHERE purchase_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(amount), 0) INTO monthly_expenses FROM public.general_expenses WHERE expense_date >= date_trunc('month', NOW());
    monthly_balance := monthly_sales - (monthly_purchases + monthly_expenses);

    -- --- CÁLCULOS GERAIS (HISTÓRICO COMPLETO) ---
    SELECT COALESCE(SUM(total_amount), 0) INTO overall_sales FROM public.sales;
    SELECT COALESCE(SUM(total_amount), 0) INTO overall_purchases FROM public.purchases;
    SELECT COALESCE(SUM(amount), 0) INTO overall_expenses FROM public.general_expenses;
    overall_balance := overall_sales - (overall_purchases + overall_expenses);

    -- --- CONSTRUÇÃO DO JSON DE RETORNO ---
    RETURN json_build_object(
        'monthly', json_build_object(
            'total_sales', monthly_sales,
            'total_purchases', monthly_purchases,
            'total_expenses', monthly_expenses,
            'balance', monthly_balance
        ),
        'overall', json_build_object(
            'total_sales', overall_sales,
            'total_purchases', overall_purchases,
            'total_expenses', overall_expenses,
            'balance', overall_balance
        )
    );
END;
$$;
