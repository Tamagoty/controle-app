-- =================================================================
-- SCRIPT 28: CORREÇÃO DAS FUNÇÕES DE VENDA/COMPRA E DATA EDITÁVEL
-- Resolve o erro de "ambiguidade de função" e adiciona a capacidade
-- de definir a data da transação principal.
-- =================================================================

-- 1. APAGAR AS FUNÇÕES ANTIGAS E AMBÍGUAS PARA GARANTIR UM ESTADO LIMPO
-- É seguro apagar, pois vamos recriá-las corretamente abaixo.
DROP FUNCTION IF EXISTS public.create_sale_with_details(UUID, UUID, INT, NUMERIC, JSONB, NUMERIC);
DROP FUNCTION IF EXISTS public.create_sale_with_details(UUID, UUID, INT, NUMERIC, JSONB, NUMERIC, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.create_purchase_with_details(UUID, INT, JSONB, NUMERIC);
DROP FUNCTION IF EXISTS public.create_purchase_with_details(UUID, INT, JSONB, NUMERIC, TIMESTAMPTZ);


-- 2. RECRIAR A FUNÇÃO DE VENDA COM TODOS OS PARÂMETROS
CREATE OR REPLACE FUNCTION public.create_sale_with_details(
    client_id_param UUID,
    seller_id_param UUID,
    cost_center_id_param INT,
    commission_percentage_param NUMERIC,
    items_param JSONB,
    sale_date_param TIMESTAMPTZ, -- Novo parâmetro para a data da venda
    payment_amount_param NUMERIC DEFAULT 0,
    payment_date_param TIMESTAMPTZ DEFAULT NOW()
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


-- 3. RECRIAR A FUNÇÃO DE COMPRA COM TODOS OS PARÂMETROS
CREATE OR REPLACE FUNCTION public.create_purchase_with_details(
    supplier_id_param UUID,
    cost_center_id_param INT,
    items_param JSONB,
    purchase_date_param TIMESTAMPTZ, -- Novo parâmetro para a data da compra
    payment_amount_param NUMERIC DEFAULT 0,
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
