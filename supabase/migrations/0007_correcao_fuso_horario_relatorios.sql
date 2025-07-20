-- =================================================================
-- SCRIPT 7: CORREÇÃO DE FUSO HORÁRIO NOS RELATÓRIOS
-- Altera as funções de relatório para incluir corretamente
-- todos os eventos do dia final selecionado no filtro.
-- =================================================================

-- Função: get_financial_report
-- Altera a cláusula WHERE para incluir o dia inteiro.
CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    report_data JSON;
    transactions_data JSONB := '[]'::JSONB;
    rec RECORD;
    total_inflow_calc NUMERIC := 0;
    total_outflow_calc NUMERIC := 0;
    net_profit_calc NUMERIC;
    end_date_inclusive TIMESTAMPTZ := p_end_date + interval '1 day'; -- Define o limite final
BEGIN
    FOR rec IN SELECT 'Receita de Venda' as description, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.payment_date >= p_start_date AND sp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount_paid); total_inflow_calc := total_inflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Pagamento a Fornecedor' as description, pp.amount_paid, pp.payment_date FROM public.purchase_payments pp WHERE pp.payment_date >= p_start_date AND pp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT ge.description, ep.amount_paid, ep.payment_date FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Pagamento de Comissão' as description, cp.amount_paid, cp.payment_date FROM public.commission_payments cp WHERE cp.payment_date >= p_start_date AND cp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    net_profit_calc := total_inflow_calc - total_outflow_calc;
    report_data := json_build_object('summary', json_build_object('total_inflow', total_inflow_calc, 'total_outflow', total_outflow_calc, 'net_profit', net_profit_calc), 'transactions', transactions_data);
    RETURN report_data;
END;
$$;

-- Função: get_product_sales_report
CREATE OR REPLACE FUNCTION public.get_product_sales_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(product_id UUID, product_name TEXT, total_quantity_sold BIGINT, total_revenue NUMERIC, average_price NUMERIC, number_of_sales BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT p.id as product_id, p.name as product_name, SUM(si.quantity) as total_quantity_sold, SUM(si.total_price) as total_revenue, AVG(si.unit_price) as average_price, COUNT(DISTINCT si.sale_id) as number_of_sales
  FROM public.sale_items si
  JOIN public.products p ON si.product_id = p.id
  JOIN public.sales s ON si.sale_id = s.id
  WHERE s.sale_date >= p_start_date AND s.sale_date < p_end_date + interval '1 day'
  GROUP BY p.id, p.name ORDER BY total_revenue DESC;
$$;

-- Função: get_sales_details_for_product
CREATE OR REPLACE FUNCTION public.get_sales_details_for_product(p_product_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
    top_clients_data JSONB;
    sales_history_data JSONB;
BEGIN
    SELECT jsonb_agg(client_sales) INTO top_clients_data FROM (
      SELECT e.name as client_name, SUM(si.total_price) as total_revenue
      FROM public.sale_items si
      JOIN public.sales s ON si.sale_id = s.id
      JOIN public.entities e ON s.client_id = e.id
      WHERE si.product_id = p_product_id AND s.sale_date >= p_start_date AND s.sale_date < p_end_date + interval '1 day'
      GROUP BY e.name ORDER BY total_revenue DESC LIMIT 5
    ) as client_sales;
    SELECT jsonb_agg(sale_details) INTO sales_history_data FROM (
      SELECT s.id as sale_id, s.sale_date, e.name as client_name, si.quantity, si.total_price
      FROM public.sale_items si
      JOIN public.sales s ON si.sale_id = s.id
      JOIN public.entities e ON s.client_id = e.id
      WHERE si.product_id = p_product_id AND s.sale_date >= p_start_date AND s.sale_date < p_end_date + interval '1 day'
      ORDER BY s.sale_date DESC
    ) as sale_details;
    RETURN json_build_object('top_clients', COALESCE(top_clients_data, '[]'::jsonb), 'sales_history', COALESCE(sales_history_data, '[]'::jsonb));
END;
$$;

-- Função: get_client_sales_report
CREATE OR REPLACE FUNCTION public.get_client_sales_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(client_id UUID, client_name TEXT, total_revenue NUMERIC, number_of_sales BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT e.id as client_id, e.name as client_name, SUM(s.total_amount) as total_revenue, COUNT(s.id) as number_of_sales
  FROM public.sales s
  JOIN public.entities e ON s.client_id = e.id
  WHERE s.sale_date >= p_start_date AND s.sale_date < p_end_date + interval '1 day'
  GROUP BY e.id, e.name ORDER BY total_revenue DESC;
$$;

-- Função: get_sales_details_for_client
CREATE OR REPLACE FUNCTION public.get_sales_details_for_client(p_client_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE(sale_id UUID, sale_date TIMESTAMPTZ, total_amount NUMERIC, products_summary TEXT)
LANGUAGE sql STABLE AS $$
  SELECT s.id as sale_id, s.sale_date, s.total_amount, string_agg(p.name, ', ') as products_summary
  FROM public.sales s
  JOIN public.sale_items si ON s.id = si.sale_id
  JOIN public.products p ON si.product_id = p.id
  WHERE s.client_id = p_client_id AND s.sale_date >= p_start_date AND s.sale_date < p_end_date + interval '1 day'
  GROUP BY s.id, s.sale_date, s.total_amount ORDER BY s.sale_date DESC;
$$;

-- Função: get_transactions_for_report
CREATE OR REPLACE FUNCTION public.get_transactions_for_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(transaction_date TIMESTAMPTZ, transaction_type TEXT, description TEXT, amount NUMERIC, cost_center_id INT, cost_center_name TEXT, entity_id UUID, entity_name TEXT, category_name TEXT)
LANGUAGE sql STABLE AS $$
  SELECT sp.payment_date as transaction_date, 'Receita de Venda' as transaction_type, 'Venda para ' || c.name as description, sp.amount_paid as amount, s.cost_center_id, cc.name as cost_center_name, s.client_id as entity_id, c.name as entity_name, 'Vendas' as category_name FROM public.sale_payments sp JOIN public.sales s ON sp.sale_id = s.id JOIN public.entities c ON s.client_id = c.id JOIN public.cost_centers cc ON s.cost_center_id = cc.id WHERE sp.payment_date >= p_start_date AND sp.payment_date < p_end_date + interval '1 day'
  UNION ALL
  SELECT pp.payment_date as transaction_date, 'Despesa de Compra' as transaction_type, 'Compra de ' || s.name as description, pp.amount_paid as amount, p.cost_center_id, cc.name as cost_center_name, p.supplier_id as entity_id, s.name as entity_name, 'Compras' as category_name FROM public.purchase_payments pp JOIN public.purchases p ON pp.purchase_id = p.id JOIN public.entities s ON p.supplier_id = s.id JOIN public.cost_centers cc ON p.cost_center_id = cc.id WHERE pp.payment_date >= p_start_date AND pp.payment_date < p_end_date + interval '1 day'
  UNION ALL
  SELECT ep.payment_date as transaction_date, 'Despesa Geral' as transaction_type, ge.description, ep.amount_paid as amount, ge.cost_center_id, cc.name as cost_center_name, ge.employee_id as entity_id, e.name as entity_name, ec.name as category_name FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id JOIN public.cost_centers cc ON ge.cost_center_id = cc.id LEFT JOIN public.entities e ON ge.employee_id = e.id JOIN public.expense_categories ec ON ge.category_id = ec.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < p_end_date + interval '1 day';
$$;

