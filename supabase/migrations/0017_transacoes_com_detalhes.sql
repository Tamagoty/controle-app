-- =================================================================
-- SCRIPT 17: FUNÇÕES PARA CRIAR TRANSAÇÕES COM PAGAMENTO
-- Cria funções RPC que permitem criar uma venda ou compra e, opcionalmente,
-- registar o primeiro pagamento numa única transação.
-- =================================================================

-- 1. Função para criar Venda com itens e pagamento opcional
CREATE OR REPLACE FUNCTION public.create_sale_with_details(
    client_id_param UUID,
    seller_id_param UUID,
    cost_center_id_param INT,
    commission_percentage_param NUMERIC,
    items_param JSONB,
    payment_amount_param NUMERIC DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID;
    item RECORD;
    total_amount_calc NUMERIC(10, 2) := 0;
    item_total_price NUMERIC(10, 2);
    product_name_temp VARCHAR(255);
BEGIN
    -- Calcula o valor total da venda a partir dos itens
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;

    -- Insere a venda e obtém o seu ID
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage)
    VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param)
    RETURNING id INTO new_sale_id;

    -- Insere os itens da venda
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2)) LOOP
        SELECT name INTO product_name_temp FROM public.products WHERE id = item.product_id;
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price, product_name_snapshot)
        VALUES (new_sale_id, item.product_id, item.quantity, item.unit_price, item_total_price, product_name_temp);
    END LOOP;

    -- Se um valor de pagamento foi fornecido, insere o pagamento
    IF payment_amount_param > 0 THEN
        INSERT INTO public.sale_payments (sale_id, amount_paid)
        VALUES (new_sale_id, payment_amount_param);
    END IF;

    -- Retorna o JSON da venda criada, incluindo o seu ID
    RETURN (SELECT row_to_json(s) FROM public.sales s WHERE s.id = new_sale_id);
END;
$$;


-- 2. Função para criar Compra com itens e pagamento opcional
CREATE OR REPLACE FUNCTION public.create_purchase_with_details(
    supplier_id_param UUID,
    cost_center_id_param INT,
    items_param JSONB,
    payment_amount_param NUMERIC DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID;
    item RECORD;
    total_amount_calc NUMERIC(10, 2) := 0;
    item_total_price NUMERIC(10, 2);
BEGIN
    -- Calcula o valor total da compra
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;

    -- Insere a compra e obtém o seu ID
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount)
    VALUES (supplier_id_param, cost_center_id_param, total_amount_calc)
    RETURNING id INTO new_purchase_id;

    -- Insere os itens da compra
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity INT, unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total_price)
        VALUES (new_purchase_id, item.product_id, item.quantity, item.unit_price, item_total_price);
    END LOOP;

    -- Se um valor de pagamento foi fornecido, insere o pagamento
    IF payment_amount_param > 0 THEN
        INSERT INTO public.purchase_payments (purchase_id, amount_paid)
        VALUES (new_purchase_id, payment_amount_param);
    END IF;

    -- Retorna o JSON da compra criada, incluindo o seu ID
    RETURN (SELECT row_to_json(p) FROM public.purchases p WHERE p.id = new_purchase_id);
END;
$$;
