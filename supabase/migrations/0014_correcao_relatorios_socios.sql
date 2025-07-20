-- =================================================================
-- SCRIPT 14: CORREÇÃO PARA INCLUIR TRANSAÇÕES DE SÓCIOS NOS RELATÓRIOS
-- Altera as funções de relatório para contabilizar aportes e retiradas.
-- =================================================================

-- Função: get_financial_report
-- Adiciona Aportes às entradas (inflow) e Retiradas às saídas (outflow).
CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    report_data JSON;
    transactions_data JSONB := '[]'::JSONB;
    rec RECORD;
    total_inflow_calc NUMERIC := 0;
    total_outflow_calc NUMERIC := 0;
    net_profit_calc NUMERIC;
    end_date_inclusive TIMESTAMPTZ := p_end_date + interval '1 day';
BEGIN
    -- Entradas
    FOR rec IN SELECT 'Receita de Venda' as description, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.payment_date >= p_start_date AND sp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount_paid); total_inflow_calc := total_inflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Aporte de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Aporte' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount); total_inflow_calc := total_inflow_calc + rec.amount; END LOOP;

    -- Saídas
    FOR rec IN SELECT 'Pagamento a Fornecedor' as description, pp.amount_paid, pp.payment_date FROM public.purchase_payments pp WHERE pp.payment_date >= p_start_date AND pp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT ge.description, ep.amount_paid, ep.payment_date FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Pagamento de Comissão' as description, cp.amount_paid, cp.payment_date FROM public.commission_payments cp WHERE cp.payment_date >= p_start_date AND cp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Retirada de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Retirada' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount); total_outflow_calc := total_outflow_calc + rec.amount; END LOOP;

    net_profit_calc := total_inflow_calc - total_outflow_calc;
    report_data := json_build_object('summary', json_build_object('total_inflow', total_inflow_calc, 'total_outflow', total_outflow_calc, 'net_profit', net_profit_calc), 'transactions', transactions_data);
    RETURN report_data;
END;
$$;


-- Função: get_transactions_for_report
-- Adiciona as transações de sócios à lista de transações detalhadas.
CREATE OR REPLACE FUNCTION public.get_transactions_for_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(transaction_date TIMESTAMPTZ, transaction_type TEXT, description TEXT, amount NUMERIC, cost_center_id INT, cost_center_name TEXT, entity_id UUID, entity_name TEXT, category_name TEXT)
LANGUAGE sql STABLE AS $$
  SELECT sp.payment_date as transaction_date, 'Receita de Venda' as transaction_type, 'Venda para ' || c.name as description, sp.amount_paid as amount, s.cost_center_id, cc.name as cost_center_name, s.client_id as entity_id, c.name as entity_name, 'Vendas' as category_name FROM public.sale_payments sp JOIN public.sales s ON sp.sale_id = s.id JOIN public.entities c ON s.client_id = c.id JOIN public.cost_centers cc ON s.cost_center_id = cc.id WHERE sp.payment_date >= p_start_date AND sp.payment_date < p_end_date + interval '1 day'
  UNION ALL
  SELECT pp.payment_date as transaction_date, 'Despesa de Compra' as transaction_type, 'Compra de ' || s.name as description, pp.amount_paid as amount, p.cost_center_id, cc.name as cost_center_name, p.supplier_id as entity_id, s.name as entity_name, 'Compras' as category_name FROM public.purchase_payments pp JOIN public.purchases p ON pp.purchase_id = p.id JOIN public.entities s ON p.supplier_id = s.id JOIN public.cost_centers cc ON p.cost_center_id = cc.id WHERE pp.payment_date >= p_start_date AND pp.payment_date < p_end_date + interval '1 day'
  UNION ALL
  SELECT ep.payment_date as transaction_date, 'Despesa Geral' as transaction_type, ge.description, ep.amount_paid as amount, ge.cost_center_id, cc.name as cost_center_name, ge.employee_id as entity_id, e.name as entity_name, ec.name as category_name FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id JOIN public.cost_centers cc ON ge.cost_center_id = cc.id LEFT JOIN public.entities e ON ge.employee_id = e.id JOIN public.expense_categories ec ON ge.category_id = ec.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < p_end_date + interval '1 day'
  UNION ALL
  SELECT pt.transaction_date, CASE WHEN pt.transaction_type = 'Aporte' THEN 'Receita de Capital' ELSE 'Despesa de Capital' END, pt.description, pt.amount, NULL, 'Capital', e.id, e.name, 'Capital de Sócio'
  FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id
  WHERE pt.transaction_date >= p_start_date AND pt.transaction_date < p_end_date + interval '1 day';
$$;
