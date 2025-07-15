-- =================================================================
-- FUNÇÃO (RPC) PARA OBTER TRANSAÇÕES PARA O RELATÓRIO DETALHADO
-- =================================================================
-- Esta função retorna uma lista "plana" de todas as transações financeiras
-- (entradas e saídas) num determinado período, com todos os detalhes
-- necessários para a filtragem e agrupamento no frontend.

CREATE OR REPLACE FUNCTION public.get_transactions_for_report(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    transaction_date TIMESTAMPTZ,
    transaction_type TEXT,
    description TEXT,
    amount NUMERIC,
    cost_center_id INT,
    cost_center_name TEXT,
    entity_id UUID,
    entity_name TEXT,
    category_name TEXT
)
LANGUAGE sql
STABLE
AS $$
-- Une todas as transações de entrada
SELECT
    sp.payment_date as transaction_date,
    'Receita de Venda' as transaction_type,
    'Venda para ' || c.name as description,
    sp.amount_paid as amount,
    s.cost_center_id,
    cc.name as cost_center_name,
    s.client_id as entity_id,
    c.name as entity_name,
    'Vendas' as category_name
FROM public.sale_payments sp
JOIN public.sales s ON sp.sale_id = s.id
JOIN public.entities c ON s.client_id = c.id
JOIN public.cost_centers cc ON s.cost_center_id = cc.id
WHERE sp.payment_date BETWEEN p_start_date AND p_end_date

UNION ALL

-- Une todas as transações de saída (Compras)
SELECT
    pp.payment_date as transaction_date,
    'Despesa de Compra' as transaction_type,
    'Compra de ' || s.name as description,
    pp.amount_paid as amount,
    p.cost_center_id,
    cc.name as cost_center_name,
    p.supplier_id as entity_id,
    s.name as entity_name,
    'Compras' as category_name
FROM public.purchase_payments pp
JOIN public.purchases p ON pp.purchase_id = p.id
JOIN public.entities s ON p.supplier_id = s.id
JOIN public.cost_centers cc ON p.cost_center_id = cc.id
WHERE pp.payment_date BETWEEN p_start_date AND p_end_date

UNION ALL

-- Une todas as transações de saída (Despesas Gerais)
SELECT
    ep.payment_date as transaction_date,
    'Despesa Geral' as transaction_type,
    ge.description,
    ep.amount_paid as amount,
    ge.cost_center_id,
    cc.name as cost_center_name,
    ge.employee_id as entity_id,
    e.name as entity_name,
    ec.name as category_name
FROM public.expense_payments ep
JOIN public.general_expenses ge ON ep.expense_id = ge.id
JOIN public.cost_centers cc ON ge.cost_center_id = cc.id
LEFT JOIN public.entities e ON ge.employee_id = e.id
JOIN public.expense_categories ec ON ge.category_id = ec.id
WHERE ep.payment_date BETWEEN p_start_date AND p_end_date;

$$;
