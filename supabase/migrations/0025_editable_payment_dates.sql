-- =================================================================
-- SCRIPT 25: DATAS DE PAGAMENTO EDITÁVEIS
-- Altera as tabelas e funções para permitir que a data de um
-- pagamento seja definida pelo utilizador.
-- =================================================================

-- 1. ALTERAR AS TABELAS DE PAGAMENTO
-- Remove o valor padrão de 'NOW()' para que a data possa ser fornecida.
ALTER TABLE public.sale_payments ALTER COLUMN payment_date DROP DEFAULT;
ALTER TABLE public.purchase_payments ALTER COLUMN payment_date DROP DEFAULT;
ALTER TABLE public.expense_payments ALTER COLUMN payment_date DROP DEFAULT;
ALTER TABLE public.commission_payments ALTER COLUMN payment_date DROP DEFAULT;


-- 2. ATUALIZAR AS FUNÇÕES QUE CRIAM PAGAMENTOS

-- Função para criar Venda com pagamento
CREATE OR REPLACE FUNCTION public.create_sale_with_details(
    client_id_param UUID, seller_id_param UUID, cost_center_id_param INT,
    commission_percentage_param NUMERIC, items_param JSONB,
    payment_amount_param NUMERIC DEFAULT 0, payment_date_param TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2); product_name_temp VARCHAR(255);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage)
    VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param) RETURNING id INTO new_sale_id;
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

-- Função para criar Compra com pagamento
CREATE OR REPLACE FUNCTION public.create_purchase_with_details(
    supplier_id_param UUID, cost_center_id_param INT, items_param JSONB,
    payment_amount_param NUMERIC DEFAULT 0, payment_date_param TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount)
    VALUES (supplier_id_param, cost_center_id_param, total_amount_calc) RETURNING id INTO new_purchase_id;
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

-- Função para criar Despesa com pagamento
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
