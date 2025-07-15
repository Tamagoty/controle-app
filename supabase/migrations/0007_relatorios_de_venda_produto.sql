-- =================================================================
-- FUNÇÕES (RPC) PARA O RELATÓRIO DE VENDAS POR PRODUTO
-- =================================================================

-- 1. Função principal que retorna o resumo de vendas por produto.
CREATE OR REPLACE FUNCTION public.get_product_sales_report(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    total_quantity_sold BIGINT,
    total_revenue NUMERIC,
    average_price NUMERIC,
    number_of_sales BIGINT
)
LANGUAGE sql
STABLE
AS $$
SELECT
    p.id as product_id,
    p.name as product_name,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.total_price) as total_revenue,
    AVG(si.unit_price) as average_price,
    COUNT(DISTINCT si.sale_id) as number_of_sales
FROM
    public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    JOIN public.sales s ON si.sale_id = s.id
WHERE
    s.sale_date BETWEEN p_start_date AND p_end_date
GROUP BY
    p.id, p.name
ORDER BY
    total_revenue DESC;
$$;


-- 2. Função secundária para obter os detalhes de vendas de um produto específico.
CREATE OR REPLACE FUNCTION public.get_sales_details_for_product(
    p_product_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    sale_date TIMESTAMPTZ,
    client_name TEXT,
    quantity INT,
    total_price NUMERIC
)
LANGUAGE sql
STABLE
AS $$
SELECT
    s.sale_date,
    e.name as client_name,
    si.quantity,
    si.total_price
FROM
    public.sale_items si
    JOIN public.sales s ON si.sale_id = s.id
    JOIN public.entities e ON s.client_id = e.id
WHERE
    si.product_id = p_product_id AND
    s.sale_date BETWEEN p_start_date AND p_end_date
ORDER BY
    s.sale_date DESC;
$$;
