-- =================================================================
-- FUNÇÃO (RPC) AVANÇADA PARA OBTER DETALHES DE VENDA DE UM PRODUTO
-- =================================================================
-- Esta nova versão retorna um único objeto JSON com duas listas:
-- 1. 'top_clients': Um resumo dos 5 maiores clientes por receita.
-- 2. 'sales_history': Um histórico detalhado de todas as vendas individuais.

-- Apaga a função antiga para permitir a alteração da sua estrutura de retorno.
DROP FUNCTION IF EXISTS public.get_sales_details_for_product(p_product_id UUID, p_start_date DATE, p_end_date DATE);

-- Cria a nova versão da função.
CREATE OR REPLACE FUNCTION public.get_sales_details_for_product(
    p_product_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    top_clients_data JSONB;
    sales_history_data JSONB;
BEGIN
    -- 1. Agrega a receita por cliente para este produto e pega o top 5
    SELECT jsonb_agg(client_sales)
    INTO top_clients_data
    FROM (
        SELECT
            e.name as client_name,
            SUM(si.total_price) as total_revenue
        FROM public.sale_items si
        JOIN public.sales s ON si.sale_id = s.id
        JOIN public.entities e ON s.client_id = e.id
        WHERE si.product_id = p_product_id
          AND s.sale_date BETWEEN p_start_date AND p_end_date
        GROUP BY e.name
        ORDER BY total_revenue DESC
        LIMIT 5
    ) as client_sales;

    -- 2. Pega o histórico de todas as vendas individuais para este produto
    SELECT jsonb_agg(sale_details)
    INTO sales_history_data
    FROM (
        SELECT
            s.id as sale_id,
            s.sale_date,
            e.name as client_name,
            si.quantity,
            si.total_price
        FROM public.sale_items si
        JOIN public.sales s ON si.sale_id = s.id
        JOIN public.entities e ON s.client_id = e.id
        WHERE si.product_id = p_product_id
          AND s.sale_date BETWEEN p_start_date AND p_end_date
        ORDER BY s.sale_date DESC
    ) as sale_details;

    -- 3. Retorna um único objeto JSON com as duas listas
    RETURN json_build_object(
        'top_clients', COALESCE(top_clients_data, '[]'::jsonb),
        'sales_history', COALESCE(sales_history_data, '[]'::jsonb)
    );
END;
$$;
