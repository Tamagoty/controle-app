-- // supabase/migrations/0002_functions.sql
-- =================================================================
-- SCRIPT 2: FUNÇÕES (RPC)
-- Cria todas as funções RPC utilizadas pela aplicação.
-- =================================================================

-- --- Funções de Lógica de Negócio (CRUD com detalhes) ---
CREATE OR REPLACE FUNCTION public.adjust_stock_quantity(p_product_id UUID, p_adjustment_quantity INT)
RETURNS VOID LANGUAGE sql AS $$
  INSERT INTO public.product_stock (product_id, quantity)
  VALUES (p_product_id, p_adjustment_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity = product_stock.quantity + p_adjustment_quantity, last_updated = NOW();
$$;

CREATE OR REPLACE FUNCTION public.create_entity_with_roles(name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_entity_id UUID; role_item TEXT;
BEGIN
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES (
      name_param, NULLIF(TRIM(email_param), ''), NULLIF(TRIM(phone_param), ''), NULLIF(TRIM(document_number_param), ''), NULLIF(TRIM(address_param), ''), entity_type_param
    ) RETURNING id INTO new_entity_id;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param LOOP
            INSERT INTO public.entity_roles (entity_id, role) VALUES (new_entity_id, role_item);
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
    UPDATE public.entities SET
      name = name_param, email = NULLIF(TRIM(email_param), ''), phone = NULLIF(TRIM(phone_param), ''), document_number = NULLIF(TRIM(document_number_param), ''), address = NULLIF(TRIM(address_param), ''), entity_type = entity_type_param
    WHERE id = entity_id_param;
    DELETE FROM public.entity_roles WHERE entity_id = entity_id_param;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param LOOP
            INSERT INTO public.entity_roles (entity_id, role) VALUES (entity_id_param, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = entity_id_param);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_with_details(
    client_id_param UUID, seller_id_param UUID, cost_center_id_param INT,
    commission_percentage_param NUMERIC, items_param JSONB, sale_date_param TIMESTAMPTZ,
    payment_amount_param NUMERIC DEFAULT 0, payment_date_param TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2); product_name_temp VARCHAR(255);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage, sale_date)
    VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param, sale_date_param)
    RETURNING id INTO new_sale_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        SELECT name INTO product_name_temp FROM public.products WHERE id = item.product_id;
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price, product_name_snapshot)
        VALUES (new_sale_id, item.product_id, item.quantity, item.unit_price, item_total_price, product_name_temp);
    END LOOP;
    IF payment_amount_param > 0 THEN
        INSERT INTO public.sale_payments (sale_id, amount_paid, payment_date)
        VALUES (new_sale_id, payment_amount_param, payment_date_param);
    END IF;
    RETURN (SELECT row_to_json(s) FROM public.sales s WHERE s.id = new_sale_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_purchase_with_details(
    supplier_id_param UUID, cost_center_id_param INT, items_param JSONB,
    purchase_date_param TIMESTAMPTZ, payment_amount_param NUMERIC DEFAULT 0,
    payment_date_param TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount, purchase_date)
    VALUES (supplier_id_param, cost_center_id_param, total_amount_calc, purchase_date_param)
    RETURNING id INTO new_purchase_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total_price)
        VALUES (new_purchase_id, item.product_id, item.quantity, item.unit_price, item_total_price);
    END LOOP;
    IF payment_amount_param > 0 THEN
        INSERT INTO public.purchase_payments (purchase_id, amount_paid, payment_date)
        VALUES (new_purchase_id, payment_amount_param, payment_date_param);
    END IF;
    RETURN (SELECT row_to_json(p) FROM public.purchases p WHERE p.id = new_purchase_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_expense_with_details(
    description_param TEXT, amount_param NUMERIC, category_id_param INT, cost_center_id_param INT,
    expense_date_param TIMESTAMPTZ, employee_id_param UUID,
    payment_amount_param NUMERIC DEFAULT 0, payment_date_param TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_expense_id UUID;
BEGIN
    INSERT INTO public.general_expenses (description, amount, category_id, cost_center_id, expense_date, employee_id)
    VALUES (description_param, amount_param, category_id_param, cost_center_id_param, expense_date_param, employee_id_param)
    RETURNING id INTO new_expense_id;
    IF payment_amount_param > 0 THEN
        INSERT INTO public.expense_payments (expense_id, amount_paid, payment_date)
        VALUES (new_expense_id, payment_amount_param, payment_date_param);
    END IF;
    RETURN (SELECT row_to_json(ge) FROM public.general_expenses ge WHERE ge.id = new_expense_id);
END;
$$;

-- Funções de Pagamento
CREATE OR REPLACE FUNCTION public.pay_seller_commission(
    a_seller_id UUID, b_payment_amount NUMERIC, c_payment_date TIMESTAMPTZ
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD; commission_due NUMERIC; commission_paid NUMERIC; commission_balance NUMERIC; payment_to_apply NUMERIC; remaining_payment_amount NUMERIC := b_payment_amount;
BEGIN
    FOR sale_record IN SELECT s.id as sale_id, s.total_amount, s.commission_percentage FROM public.sales s WHERE s.seller_id = a_seller_id AND s.commission_percentage > 0 ORDER BY s.sale_date ASC LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        commission_due := sale_record.total_amount * (sale_record.commission_percentage / 100);
        SELECT COALESCE(SUM(amount_paid), 0) INTO commission_paid FROM public.commission_payments WHERE sale_id = sale_record.sale_id;
        commission_balance := commission_due - commission_paid;
        IF commission_balance > 0 THEN
            payment_to_apply := LEAST(remaining_payment_amount, commission_balance);
            INSERT INTO public.commission_payments (seller_id, sale_id, amount_paid, payment_date) 
            VALUES (a_seller_id, sale_record.sale_id, payment_to_apply, c_payment_date);
            remaining_payment_amount := remaining_payment_amount - payment_to_apply;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_client_debt(
    p_client_id UUID, p_payment_amount NUMERIC, p_payment_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE(payment_id UUID) LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD; payment_to_apply NUMERIC; remaining_payment_amount NUMERIC := p_payment_amount; first_payment_id UUID := NULL; newly_created_payment_id UUID;
BEGIN
    FOR sale_record IN SELECT s.id as sale_id, (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) as balance FROM public.sales s WHERE s.client_id = p_client_id AND (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) > 0 ORDER BY s.sale_date ASC LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, sale_record.balance);
        INSERT INTO public.sale_payments (sale_id, amount_paid, payment_date) VALUES (sale_record.sale_id, payment_to_apply, p_payment_date) RETURNING id INTO newly_created_payment_id;
        IF first_payment_id IS NULL THEN
            first_payment_id := newly_created_payment_id;
        END IF;
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
    RETURN QUERY SELECT first_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_supplier_debt(
    p_supplier_id UUID, p_payment_amount NUMERIC, p_payment_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE(payment_id UUID) LANGUAGE plpgsql AS $$
DECLARE
    purchase_record RECORD; payment_to_apply NUMERIC; remaining_payment_amount NUMERIC := p_payment_amount; first_payment_id UUID := NULL; newly_created_payment_id UUID;
BEGIN
    FOR purchase_record IN SELECT p.id as purchase_id, (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) as balance FROM public.purchases p WHERE p.supplier_id = p_supplier_id AND (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) > 0 ORDER BY p.purchase_date ASC LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, purchase_record.balance);
        INSERT INTO public.purchase_payments (purchase_id, amount_paid, payment_date) VALUES (purchase_record.purchase_id, payment_to_apply, p_payment_date) RETURNING id INTO newly_created_payment_id;
        IF first_payment_id IS NULL THEN
            first_payment_id := newly_created_payment_id;
        END IF;
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
    RETURN QUERY SELECT first_payment_id;
END;
$$;

-- Funções de Exclusão Segura
CREATE OR REPLACE FUNCTION public.delete_sale(p_sale_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    sale_item RECORD;
BEGIN
    FOR sale_item IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = p_sale_id LOOP
        UPDATE public.product_stock SET quantity = quantity + sale_item.quantity WHERE product_id = sale_item.product_id;
    END LOOP;
    DELETE FROM public.sales WHERE id = p_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_purchase(p_purchase_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    purchase_item RECORD;
BEGIN
    FOR purchase_item IN SELECT product_id, quantity FROM public.purchase_items WHERE purchase_id = p_purchase_id LOOP
        UPDATE public.product_stock SET quantity = quantity - purchase_item.quantity WHERE product_id = purchase_item.product_id;
    END LOOP;
    DELETE FROM public.purchases WHERE id = p_purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expense(p_expense_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM public.general_expenses WHERE id = p_expense_id;
END;
$$;

-- Funções de Leitura (GET) para as páginas
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_full_user_profile(p_user_id UUID)
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'role', (SELECT role FROM public.user_roles WHERE user_id = p_user_id),
    'name', (SELECT name FROM public.entities WHERE user_id = p_user_id),
    'avatar_url', (SELECT avatar_url FROM public.user_profiles WHERE user_id = p_user_id),
    'media_settings', (SELECT media_settings FROM public.user_profiles WHERE user_id = p_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.update_my_name(new_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    entity_record_id UUID; auth_user_id UUID := auth.uid(); auth_user_email TEXT := (SELECT email FROM auth.users WHERE id = auth_user_id);
BEGIN
    SELECT id INTO entity_record_id FROM public.entities WHERE user_id = auth_user_id;
    IF entity_record_id IS NOT NULL THEN
        UPDATE public.entities SET name = new_name WHERE id = entity_record_id;
    ELSE
        SELECT id INTO entity_record_id FROM public.entities WHERE email = auth_user_email AND user_id IS NULL;
        IF entity_record_id IS NOT NULL THEN
            UPDATE public.entities SET name = new_name, user_id = auth_user_id WHERE id = entity_record_id;
        ELSE
            INSERT INTO public.entities (name, email, entity_type, user_id)
            VALUES (new_name, auth_user_email, 'Pessoa', auth_user_id)
            ON CONFLICT (email) DO UPDATE SET name = new_name, user_id = auth_user_id
            RETURNING id INTO entity_record_id;
            INSERT INTO public.entity_roles (entity_id, role)
            VALUES (entity_record_id, 'Funcionário') ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_with_payment_status()
RETURNS TABLE(id UUID, sale_date TIMESTAMPTZ, client_name TEXT, seller_name TEXT, cost_center_name TEXT, total_amount NUMERIC, commission_percentage NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT s.id, s.sale_date, client_entity.name as client_name, seller_entity.name as seller_name, cc.name as cost_center_name, s.total_amount, s.commission_percentage, COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as total_paid, s.total_amount - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp WHERE sp.sale_id = s.id), 0) as balance FROM public.sales s LEFT JOIN public.entities client_entity ON s.client_id = client_entity.id LEFT JOIN public.entities seller_entity ON s.seller_id = seller_entity.id LEFT JOIN public.cost_centers cc ON s.cost_center_id = cc.id ORDER BY s.sale_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_purchases_with_payment_status()
RETURNS TABLE(id UUID, purchase_date TIMESTAMPTZ, supplier_name TEXT, cost_center_name TEXT, total_amount NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT p.id, p.purchase_date, supplier_entity.name as supplier_name, cc.name as cost_center_name, p.total_amount, COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as total_paid, p.total_amount - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp WHERE pp.purchase_id = p.id), 0) as balance FROM public.purchases p LEFT JOIN public.entities supplier_entity ON p.supplier_id = supplier_entity.id LEFT JOIN public.cost_centers cc ON p.cost_center_id = cc.id ORDER BY p.purchase_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_expenses_with_payment_status()
RETURNS TABLE(id UUID, description TEXT, amount NUMERIC, expense_date TIMESTAMPTZ, category_name TEXT, cost_center_name TEXT, employee_name TEXT, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT ge.id, ge.description, ge.amount, ge.expense_date, ec.name as category_name, cc.name as cost_center_name, e.name as employee_name, COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as total_paid, ge.amount - COALESCE((SELECT SUM(ep.amount_paid) FROM public.expense_payments ep WHERE ep.expense_id = ge.id), 0) as balance FROM public.general_expenses ge LEFT JOIN public.expense_categories ec ON ge.category_id = ec.id LEFT JOIN public.cost_centers cc ON ge.cost_center_id = cc.id LEFT JOIN public.entities e ON ge.employee_id = e.id ORDER BY ge.expense_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_commission_summary()
RETURNS TABLE(seller_id UUID, seller_name TEXT, total_commission_due NUMERIC, total_commission_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as seller_id, e.name as seller_name, COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) as total_commission_due, COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as total_commission_paid, COALESCE(SUM(s.total_amount * (s.commission_percentage / 100)), 0) - COALESCE((SELECT SUM(cp.amount_paid) FROM public.commission_payments cp WHERE cp.seller_id = e.id), 0) as balance FROM public.entities e JOIN public.sales s ON e.id = s.seller_id WHERE s.commission_percentage > 0 GROUP BY e.id, e.name ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_accounts_receivable_summary()
RETURNS TABLE(client_id UUID, client_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as client_id, e.name as client_name, COALESCE(SUM(s.total_amount), 0) as total_due, COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as total_paid, COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0) as balance FROM public.entities e JOIN public.sales s ON e.id = s.client_id GROUP BY e.id, e.name HAVING (COALESCE(SUM(s.total_amount), 0) - COALESCE((SELECT SUM(sp.amount_paid) FROM public.sale_payments sp JOIN public.sales s_inner ON sp.sale_id = s_inner.id WHERE s_inner.client_id = e.id), 0)) > 0 ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_accounts_payable_summary()
RETURNS TABLE(supplier_id UUID, supplier_name TEXT, total_due NUMERIC, total_paid NUMERIC, balance NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT e.id as supplier_id, e.name as supplier_name, COALESCE(SUM(p.total_amount), 0) as total_due, COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as total_paid, COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0) as balance FROM public.entities e JOIN public.purchases p ON e.id = p.supplier_id GROUP BY e.id, e.name HAVING (COALESCE(SUM(p.total_amount), 0) - COALESCE((SELECT SUM(pp.amount_paid) FROM public.purchase_payments pp JOIN public.purchases p_inner ON pp.purchase_id = p_inner.id WHERE p_inner.supplier_id = e.id), 0)) > 0 ORDER BY balance DESC, e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_partners_with_details()
RETURNS TABLE(id UUID, entity_id UUID, name TEXT, equity_percentage NUMERIC, is_active BOOLEAN, entry_date DATE, exit_date DATE)
LANGUAGE sql STABLE AS $$ SELECT p.id, e.id AS entity_id, e.name, p.equity_percentage, p.is_active, p.entry_date, p.exit_date FROM public.entities e INNER JOIN public.entity_roles er ON e.id = er.entity_id AND er.role = 'Sócio' LEFT JOIN public.partners p ON e.id = p.entity_id ORDER BY e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_products_with_details()
RETURNS TABLE(id UUID, name TEXT, description TEXT, sale_price NUMERIC, purchase_price NUMERIC, product_type TEXT, unit_of_measure TEXT, is_active BOOLEAN, category_id INT, category_name TEXT, stock_quantity NUMERIC)
LANGUAGE sql STABLE AS $$ SELECT p.id, p.name, p.description, p.sale_price, p.purchase_price, p.product_type, p.unit_of_measure, p.is_active, p.category_id, pc.name as category_name, COALESCE(ps.quantity, 0) as stock_quantity FROM public.products p LEFT JOIN public.product_categories pc ON p.category_id = pc.id LEFT JOIN public.product_stock ps ON p.id = ps.product_id ORDER BY p.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_entities_with_roles()
RETURNS TABLE(id UUID, name TEXT, email TEXT, phone TEXT, document_number TEXT, address TEXT, entity_type TEXT, is_active BOOLEAN, roles TEXT)
LANGUAGE sql STABLE AS $$ SELECT e.id, e.name, e.email, e.phone, e.document_number, e.address, e.entity_type, e.is_active, string_agg(er.role, ', ') as roles FROM public.entities e LEFT JOIN public.entity_roles er ON e.id = er.entity_id GROUP BY e.id ORDER BY e.name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT u.id as user_id, u.email, ur.role FROM auth.users u LEFT JOIN public.user_roles ur ON u.id = ur.user_id ORDER BY u.email ASC; $$;

CREATE OR REPLACE FUNCTION public.get_cost_centers()
RETURNS TABLE(id INT, name TEXT, description TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ, finalization_date TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$ SELECT id, name, description, is_active, created_at, finalization_date FROM public.cost_centers ORDER BY name ASC; $$;

CREATE OR REPLACE FUNCTION public.get_partner_transactions()
RETURNS TABLE(id UUID, transaction_date TIMESTAMPTZ, partner_name TEXT, transaction_type TEXT, amount NUMERIC, description TEXT)
LANGUAGE sql STABLE AS $$ SELECT pt.id, pt.transaction_date, e.name as partner_name, pt.transaction_type, pt.amount, pt.description FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id ORDER BY pt.transaction_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_sale_payments(p_sale_id UUID)
RETURNS TABLE (id UUID, amount_paid NUMERIC, payment_date TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$ SELECT sp.id, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.sale_id = p_sale_id ORDER BY sp.payment_date DESC; $$;

CREATE OR REPLACE FUNCTION public.get_commission_payments_for_seller(p_seller_id UUID)
RETURNS TABLE(id UUID, amount_paid NUMERIC, payment_date TIMESTAMPTZ, sale_id UUID)
LANGUAGE sql STABLE AS $$ SELECT cp.id, cp.amount_paid, cp.payment_date, cp.sale_id FROM public.commission_payments cp WHERE cp.seller_id = p_seller_id ORDER BY cp.payment_date DESC; $$;

-- Funções de Relatórios
CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date DATE, p_end_date DATE)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    report_data JSON; transactions_data JSONB := '[]'::JSONB; rec RECORD; total_inflow_calc NUMERIC := 0; total_outflow_calc NUMERIC := 0; net_profit_calc NUMERIC; end_date_inclusive TIMESTAMPTZ := p_end_date + interval '1 day';
BEGIN
    FOR rec IN SELECT 'Receita de Venda' as description, sp.amount_paid, sp.payment_date FROM public.sale_payments sp WHERE sp.payment_date >= p_start_date AND sp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount_paid); total_inflow_calc := total_inflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Aporte de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Aporte' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Receita', 'description', rec.description, 'amount', rec.amount); total_inflow_calc := total_inflow_calc + rec.amount; END LOOP;
    FOR rec IN SELECT 'Pagamento a Fornecedor' as description, pp.amount_paid, pp.payment_date FROM public.purchase_payments pp WHERE pp.payment_date >= p_start_date AND pp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT ge.description, ep.amount_paid, ep.payment_date FROM public.expense_payments ep JOIN public.general_expenses ge ON ep.expense_id = ge.id WHERE ep.payment_date >= p_start_date AND ep.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Pagamento de Comissão' as description, cp.amount_paid, cp.payment_date FROM public.commission_payments cp WHERE cp.payment_date >= p_start_date AND cp.payment_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.payment_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount_paid); total_outflow_calc := total_outflow_calc + rec.amount_paid; END LOOP;
    FOR rec IN SELECT 'Retirada de Sócio: ' || e.name as description, pt.amount, pt.transaction_date FROM public.partner_transactions pt JOIN public.partners p ON pt.partner_id = p.id JOIN public.entities e ON p.entity_id = e.id WHERE pt.transaction_type = 'Retirada' AND pt.transaction_date >= p_start_date AND pt.transaction_date < end_date_inclusive LOOP transactions_data := transactions_data || jsonb_build_object('date', rec.transaction_date, 'type', 'Despesa', 'description', rec.description, 'amount', rec.amount); total_outflow_calc := total_outflow_calc + rec.amount; END LOOP;
    net_profit_calc := total_inflow_calc - total_outflow_calc;
    report_data := json_build_object('summary', json_build_object('total_inflow', total_inflow_calc, 'total_outflow', total_outflow_calc, 'net_profit', net_profit_calc), 'transactions', transactions_data);
    RETURN report_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_main_dashboard_data()
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
    monthly_sales NUMERIC; monthly_purchases NUMERIC; monthly_expenses NUMERIC; monthly_balance NUMERIC;
    overall_sales NUMERIC; overall_purchases NUMERIC; overall_expenses NUMERIC; overall_balance NUMERIC;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO monthly_sales FROM public.sales WHERE sale_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(total_amount), 0) INTO monthly_purchases FROM public.purchases WHERE purchase_date >= date_trunc('month', NOW());
    SELECT COALESCE(SUM(amount), 0) INTO monthly_expenses FROM public.general_expenses WHERE expense_date >= date_trunc('month', NOW());
    monthly_balance := monthly_sales - (monthly_purchases + monthly_expenses);
    SELECT COALESCE(SUM(total_amount), 0) INTO overall_sales FROM public.sales;
    SELECT COALESCE(SUM(total_amount), 0) INTO overall_purchases FROM public.purchases;
    SELECT COALESCE(SUM(amount), 0) INTO overall_expenses FROM public.general_expenses;
    overall_balance := overall_sales - (overall_purchases + overall_expenses);
    RETURN json_build_object(
        'monthly', json_build_object('total_sales', monthly_sales, 'total_purchases', monthly_purchases, 'total_expenses', monthly_expenses, 'balance', monthly_balance),
        'overall', json_build_object('total_sales', overall_sales, 'total_purchases', overall_purchases, 'total_expenses', overall_expenses, 'balance', overall_balance)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
    summary_data JSON; transactions_data JSONB; total_aportes NUMERIC; total_retiradas NUMERIC;
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'Aporte' THEN amount ELSE 0 END), 0), COALESCE(SUM(CASE WHEN transaction_type = 'Retirada' THEN amount ELSE 0 END), 0)
    INTO total_aportes, total_retiradas FROM public.partner_transactions WHERE partner_id = p_partner_id;
    summary_data := json_build_object('total_aportes', total_aportes, 'total_retiradas', total_retiradas, 'saldo_atual', total_aportes - total_retiradas);
    SELECT jsonb_agg(json_build_object('id', pt.id, 'transaction_date', pt.transaction_date, 'transaction_type', pt.transaction_type, 'amount', pt.amount, 'description', pt.description) ORDER BY pt.transaction_date DESC)
    INTO transactions_data FROM public.partner_transactions pt WHERE pt.partner_id = p_partner_id;
    RETURN json_build_object('summary', summary_data, 'transactions', COALESCE(transactions_data, '[]'::jsonb));
END;
$$;
