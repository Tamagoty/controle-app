-- =================================================================
-- SCRIPT 2: FUNÇÕES E AUTOMAÇÕES
-- Cria todas as funções RPC e Triggers.
-- =================================================================

-- --- FUNÇÕES DE LÓGICA DE NEGÓCIO ---

-- Função de Controlo de Stock
CREATE OR REPLACE FUNCTION public.handle_stock_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'purchase_items') THEN
    INSERT INTO public.product_stock (product_id, quantity)
    VALUES (NEW.product_id, NEW.quantity)
    ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity + NEW.quantity, last_updated = NOW();
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'sale_items') THEN
    INSERT INTO public.product_stock (product_id, quantity)
    VALUES (NEW.product_id, -NEW.quantity)
    ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity - NEW.quantity, last_updated = NOW();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers para o Controlo de Stock
DROP TRIGGER IF EXISTS on_purchase_item_insert ON public.purchase_items;
CREATE TRIGGER on_purchase_item_insert AFTER INSERT ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION handle_stock_change();
DROP TRIGGER IF EXISTS on_sale_item_insert ON public.sale_items;
CREATE TRIGGER on_sale_item_insert AFTER INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION handle_stock_change();

-- Função para Ajuste Manual de Stock
CREATE OR REPLACE FUNCTION public.adjust_stock_quantity(p_product_id UUID, p_adjustment_quantity INT)
RETURNS VOID LANGUAGE sql AS $$
  INSERT INTO public.product_stock (product_id, quantity)
  VALUES (p_product_id, p_adjustment_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity + p_adjustment_quantity, last_updated = NOW();
$$;

-- Funções para criar transações completas
CREATE OR REPLACE FUNCTION public.create_purchase_with_items(supplier_id_param UUID, cost_center_id_param INT, items_param JSONB)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID;
    item RECORD;
    total_amount_calc NUMERIC(10, 2) := 0;
    item_total_price NUMERIC(10, 2);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2))
    LOOP
        item_total_price := item.quantity * item.unit_price;
        total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount)
    VALUES (supplier_id_param, cost_center_id_param, total_amount_calc)
    RETURNING id INTO new_purchase_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2))
    LOOP
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total_price)
        VALUES (new_purchase_id, item.product_id, item.quantity, item.unit_price, item_total_price);
    END LOOP;
    RETURN (SELECT row_to_json(p) FROM public.purchases p WHERE p.id = new_purchase_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_with_items(client_id_param UUID, seller_id_param UUID, cost_center_id_param INT, commission_percentage_param NUMERIC, items_param JSONB)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID;
    item RECORD;
    total_amount_calc NUMERIC(10, 2) := 0;
    item_total_price NUMERIC(10, 2);
    product_name_temp VARCHAR(255);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2))
    LOOP
        item_total_price := item.quantity * item.unit_price;
        total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage)
    VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param)
    RETURNING id INTO new_sale_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2))
    LOOP
        SELECT name INTO product_name_temp FROM public.products WHERE id = item.product_id;
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price, product_name_snapshot)
        VALUES (new_sale_id, item.product_id, item.quantity, item.unit_price, item_total_price, product_name_temp);
    END LOOP;
    RETURN (SELECT row_to_json(s) FROM public.sales s WHERE s.id = new_sale_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_entity_with_roles(name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_entity_id UUID;
    role_item TEXT;
BEGIN
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type)
    VALUES (name_param, email_param, phone_param, document_number_param, address_param, entity_type_param)
    RETURNING id INTO new_entity_id;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param
        LOOP
            INSERT INTO public.entity_roles (entity_id, role)
            VALUES (new_entity_id, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = new_entity_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_entity_with_roles(entity_id_param UUID, name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    role_item TEXT;
BEGIN
    UPDATE public.entities
    SET name = name_param, email = email_param, phone = phone_param, document_number = document_number_param, address = address_param, entity_type = entity_type_param
    WHERE id = entity_id_param;
    DELETE FROM public.entity_roles WHERE entity_id = entity_id_param;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param
        LOOP
            INSERT INTO public.entity_roles (entity_id, role)
            VALUES (entity_id_param, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = entity_id_param);
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_seller_commission(p_seller_id UUID, p_payment_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD;
    commission_due NUMERIC;
    commission_paid NUMERIC;
    commission_balance NUMERIC;
    payment_to_apply NUMERIC;
    remaining_payment_amount NUMERIC := p_payment_amount;
BEGIN
    FOR sale_record IN
        SELECT s.id as sale_id, s.total_amount, s.commission_percentage FROM public.sales s
        WHERE s.seller_id = p_seller_id AND s.commission_percentage > 0 ORDER BY s.sale_date ASC
    LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        commission_due := sale_record.total_amount * (sale_record.commission_percentage / 100);
        SELECT COALESCE(SUM(amount_paid), 0) INTO commission_paid FROM public.commission_payments WHERE sale_id = sale_record.sale_id;
        commission_balance := commission_due - commission_paid;
        IF commission_balance > 0 THEN
            payment_to_apply := LEAST(remaining_payment_amount, commission_balance);
            INSERT INTO public.commission_payments (seller_id, sale_id, amount_paid) VALUES (p_seller_id, sale_record.sale_id, payment_to_apply);
            remaining_payment_amount := remaining_payment_amount - payment_to_apply;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_client_debt(p_client_id UUID, p_payment_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD;
    payment_to_apply NUMERIC;
    remaining_payment_amount NUMERIC := p_payment_amount;
BEGIN
    FOR sale_record IN
        SELECT s.id as sale_id, (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) as balance
        FROM public.sales s
        WHERE s.client_id = p_client_id AND (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) > 0
        ORDER BY s.sale_date ASC
    LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, sale_record.balance);
        INSERT INTO public.sale_payments (sale_id, amount_paid) VALUES (sale_record.sale_id, payment_to_apply);
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
END;
$$;


-- --- FUNÇÕES DE "GET" PARA AS PÁGINAS ---
CREATE OR REPLACE FUNCTION public.get_sales_with_payment_status()
RETURNS TABLE(id UUID, sale_date TIMESTAMPTZ, client_name TEXT, seller_name TEXT, cost_center_name TEXT, total_amount NUMERIC, commission_percentage NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT s.id, s.sale_date, client_entity.name as client_name, seller_entity.name as seller_name, cc.name as cost_center_name, s.total_amount, s.commission_percentage,
      COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as total_paid,
      s.total_amount - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as balance
  FROM public.sales s
  LEFT JOIN public.entities client_entity ON s.client_id = client_entity.id
  LEFT JOIN public.entities seller_entity ON s.seller_id = seller_entity.id
  LEFT JOIN public.cost_centers cc ON s.cost_center_id = cc.id
  ORDER BY s.sale_date DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_purchases_with_payment_status()
RETURNS TABLE(id UUID, purchase_date TIMESTAMPTZ, supplier_name TEXT, cost_center_name TEXT, total_amount NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT p.id, p.purchase_date, supplier_entity.name as supplier_name, cc.name as cost_center_name, p.total_amount,
      COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as total_paid,
      p.total_amount - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as balance
  FROM public.purchases p
  LEFT JOIN public.entities supplier_entity ON p.supplier_id = supplier_entity.id
  LEFT JOIN public.cost_centers cc ON p.cost_center_id = cc.id
  ORDER BY p.purchase_date DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_expenses_with_payment_status()
RETURNS TABLE(id UUID, description TEXT, amount NUMERIC, expense_date TIMESTAMPTZ, category_name TEXT, cost_center_name TEXT, employee_name TEXT, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT ge.id, ge.description, ge.amount, ge.expense_date, ec.name as category_name, cc.name as cost_center_name, e.name as employee_name,
      COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as total_paid,
      ge.amount - COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as balance
  FROM public.general_expenses ge
  LEFT JOIN public.expense_categories ec ON ge.category_id = ec.id
  LEFT JOIN public.cost_centers cc ON ge.cost_center_id = cc.id
  LEFT JOIN public.entities e ON ge.employee_id = e.id
  ORDER BY ge.expense_date DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_commission_summary()
RETURNS TABLE(seller_id UUID, seller_name TEXT, total_commission_due NUMERIC, total_commission_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT e.id as seller_id, e.name as seller_name,
      COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) as total_commission_due,
      COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as total_commission_paid,
      COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) - COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as balance
  FROM public.entities e JOIN public.sales s ON e.id = s.seller_id
  WHERE s.commission_percentage > 0
  GROUP BY e.id, e.name ORDER BY balance DESC, e.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_accounts_receivable_summary()
RETURNS TABLE(client_id UUID, client_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT e.id as client_id, e.name as client_name, COALESCE(SUM(s.total_amount), 0) as total_due,
      COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as total_paid,
      COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as balance
  FROM public.entities e JOIN public.sales s ON e.id = s.client_id
  GROUP BY e.id, e.name
  HAVING (COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0)) > 0
  ORDER BY balance DESC, e.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_accounts_payable_summary()
RETURNS TABLE(supplier_id UUID, supplier_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT e.id as supplier_id, e.name as supplier_name, COALESCE(SUM(p.total_amount), 0) as total_due,
      COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as total_paid,
      COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as balance
  FROM public.entities e JOIN public.purchases p ON e.id = p.supplier_id
  GROUP BY e.id, e.name
  HAVING (COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0)) > 0
  ORDER BY balance DESC, e.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_partners_with_details()
RETURNS TABLE(id UUID, entity_id UUID, name TEXT, equity_percentage NUMERIC, is_active BOOLEAN, entry_date DATE, exit_date DATE)
LANGUAGE sql STABLE AS $$
  SELECT p.id, e.id AS entity_id, e.name, p.equity_percentage, p.is_active, p.entry_date, p.exit_date
  FROM public.entities e
  INNER JOIN public.entity_roles er ON e.id = er.entity_id AND er.role = 'Sócio'
  LEFT JOIN public.partners p ON e.id = p.entity_id
  ORDER BY e.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_products_with_details()
RETURNS TABLE(id UUID, name TEXT, description TEXT, sale_price NUMERIC, purchase_price NUMERIC, product_type TEXT, unit_of_measure TEXT, is_active BOOLEAN, category_id INT, category_name TEXT, stock_quantity INT)
LANGUAGE sql STABLE AS $$
  SELECT p.id, p.name, p.description, p.sale_price, p.purchase_price, p.product_type, p.unit_of_measure, p.is_active, p.category_id, pc.name as category_name, COALESCE(ps.quantity, 0) as stock_quantity
  FROM public.products p
  LEFT JOIN public.product_categories pc ON p.category_id = pc.id
  LEFT JOIN public.product_stock ps ON p.id = ps.product_id
  ORDER BY p.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_entities_with_roles()
RETURNS TABLE(id UUID, name TEXT, email TEXT, phone TEXT, document_number TEXT, address TEXT, entity_type TEXT, is_active BOOLEAN, roles TEXT)
LANGUAGE sql STABLE AS $$
  SELECT e.id, e.name, e.email, e.phone, e.document_number, e.address, e.entity_type, e.is_active, string_agg(er.role, ', ') as roles
  FROM public.entities e LEFT JOIN public.entity_roles er ON e.id = er.entity_id
  GROUP BY e.id, e.name, e.email, e.phone, e.document_number, e.address, e.entity_type, e.is_active
  ORDER BY e.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT u.id as user_id, u.email, ur.role
  FROM auth.users u LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  ORDER BY u.email ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    report_data JSON;
    transactions_data JSONB := '[]'::JSONB;
    rec RECORD;
    total_inflow_calc NUMERIC := 0;
    total_outflow_calc NUMERIC := 0;
    net_profit_calc NUMERIC;
BEGIN
    FOR rec IN SELECT 'Receita de Venda' as description, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.payment_date BETWEEN p_start_date AND p_end_date LOOP
        transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount_paid);
        total_inflow_calc := total_inflow_calc + rec.amount_paid;
    END LOOP;
    FOR rec IN SELECT 'Pagamento a Fornecedor' as description, pp.amount_paid, pp.payment_date FROM public.purchase_payments pp WHERE pp.payment_date BETWEEN p_start_date AND p_end_date LOOP
        transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid);
        total_outflow_calc := total_outflow_calc + rec.amount_paid;
    END LOOP;
    FOR rec IN SELECT ge.description, ep.amount_paid, ep.payment_date FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id WHERE ep.payment_date BETWEEN p_start_date AND p_end_date LOOP
        transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid);
        total_outflow_calc := total_outflow_calc + rec.amount_paid;
    END LOOP;
    FOR rec IN SELECT 'Pagamento de Comissão' as description, cp.amount_paid, cp.payment_date FROM public.commission_payments cp WHERE cp.payment_date BETWEEN p_start_date AND p_end_date LOOP
        transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid);
        total_outflow_calc := total_outflow_calc + rec.amount_paid;
    END LOOP;
    net_profit_calc := total_inflow_calc - total_outflow_calc;
    report_data := json_build_object('summary', json_build_object('total_inflow', total_inflow_calc, 'total_outflow', total_outflow_calc, 'net_profit', net_profit_calc), 'transactions', transactions_data);
    RETURN report_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_full_dashboard_data()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    sales_total_month NUMERIC; purchases_total_month NUMERIC; new_clients_month INT; cash_balance NUMERIC; total_stock_value NUMERIC;
    sales_over_time JSONB; recent_sales JSONB; total_inflow_calc NUMERIC; total_outflow_calc NUMERIC;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO sales_total_month FROM public.sales WHERE sale_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(total_amount), 0) INTO purchases_total_month FROM public.purchases WHERE purchase_date >= date_trunc('month', NOW());
    SELECT COUNT(*) INTO new_clients_month FROM public.entity_roles er JOIN public.entities e ON er.entity_id = e.id WHERE er.role = 'Cliente' AND e.created_at >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(p.purchase_price * ps.quantity), 0) INTO total_stock_value FROM public.product_stock ps JOIN public.products p ON ps.product_id = p.id;
    SELECT (SELECT COALESCE(SUM(amount_paid), 0) FROM public.sale_payments) + (SELECT COALESCE(SUM(amount), 0) FROM public.partner_transactions WHERE transaction_type = 'Aporte') INTO total_inflow_calc;
    SELECT (SELECT COALESCE(SUM(amount_paid), 0) FROM public.purchase_payments) + (SELECT COALESCE(SUM(ep.amount_paid), 0) FROM public.expense_payments ep) + (SELECT COALESCE(SUM(amount_paid), 0) FROM public.commission_payments) + (SELECT COALESCE(SUM(amount), 0) FROM public.partner_transactions WHERE transaction_type = 'Retirada') INTO total_outflow_calc;
    cash_balance := total_inflow_calc - total_outflow_calc;
    SELECT jsonb_agg(daily_sales) INTO sales_over_time FROM (SELECT TO_CHAR(day_series.day, 'DD/MM') as date, COALESCE(SUM(s.total_amount), 0) as total FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day'::interval) as day_series(day) LEFT JOIN public.sales s ON date_trunc('day', s.sale_date) = date_trunc('day', day_series.day) GROUP BY day_series.day ORDER BY day_series.day) as daily_sales;
    SELECT jsonb_agg(recent_sales_data) INTO recent_sales FROM (SELECT s.id, s.sale_date, s.total_amount, e.name as client_name FROM public.sales s JOIN public.entities e ON s.client_id = e.id ORDER BY s.sale_date DESC LIMIT 5) as recent_sales_data;
    RETURN json_build_object('summary', json_build_object('sales_total_month', sales_total_month, 'purchases_total_month', purchases_total_month, 'new_clients_month', new_clients_month, 'cash_balance', cash_balance, 'total_stock_value', total_stock_value), 'sales_over_time', sales_over_time, 'recent_sales', recent_sales);
END;
$$;