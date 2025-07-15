-- =================================================================
-- FUNÇÕES (RPC) PARA O RELATÓRIO DE VENDAS POR CLIENTE
-- =================================================================

-- 1. Função principal que retorna o resumo de vendas por cliente.
CREATE OR REPLACE FUNCTION public.get_client_sales_report(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    client_id UUID,
    client_name TEXT,
    total_revenue NUMERIC,
    number_of_sales BIGINT
)
LANGUAGE sql
STABLE
AS $$
SELECT
    e.id as client_id,
    e.name as client_name,
    SUM(s.total_amount) as total_revenue,
    COUNT(s.id) as number_of_sales
FROM
    public.sales s
    JOIN public.entities e ON s.client_id = e.id
WHERE
    s.sale_date BETWEEN p_start_date AND p_end_date
GROUP BY
    e.id, e.name
ORDER BY
    total_revenue DESC;
$$;


-- 2. Função secundária para obter os detalhes das vendas de um cliente específico.
CREATE OR REPLACE FUNCTION public.get_sales_details_for_client(
    p_client_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    sale_id UUID,
    sale_date TIMESTAMPTZ,
    total_amount NUMERIC,
    products_summary TEXT
)
LANGUAGE sql
STABLE
AS $$
SELECT
    s.id as sale_id,
    s.sale_date,
    s.total_amount,
    -- Agrega os nomes dos produtos de cada venda para um resumo rápido.
    string_agg(p.name, ', ') as products_summary
FROM
    public.sales s
    JOIN public.sale_items si ON s.id = si.sale_id
    JOIN public.products p ON si.product_id = p.id
WHERE
    s.client_id = p_client_id AND
    s.sale_date BETWEEN p_start_date AND p_end_date
GROUP BY
    s.id, s.sale_date, s.total_amount
ORDER BY
    s.sale_date DESC;
$$;
