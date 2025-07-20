-- =================================================================
-- SCRIPT 18: LAPIDAÇÃO DE FORMULÁRIOS E MELHORIAS DE USABILIDADE
-- Altera as tabelas de itens para permitir quantidades fracionadas.
-- =================================================================

-- Altera a coluna 'quantity' para aceitar valores numéricos com até 3 casas decimais.
-- Isto permite registar, por exemplo, 1.5 kg ou 2.25 L.

ALTER TABLE public.sale_items
ALTER COLUMN quantity TYPE NUMERIC(10, 3);

ALTER TABLE public.purchase_items
ALTER COLUMN quantity TYPE NUMERIC(10, 3);

-- Atualiza as funções que recebem a quantidade para garantir a compatibilidade.
-- O Supabase geralmente lida bem com a conversão, mas vamos garantir
-- que o tipo no JSONB seja tratado corretamente.

CREATE OR REPLACE FUNCTION public.create_purchase_with_items(supplier_id_param UUID, cost_center_id_param INT, items_param JSONB)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_purchase_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.purchases (supplier_id, cost_center_id, total_amount) VALUES (supplier_id_param, cost_center_id_param, total_amount_calc) RETURNING id INTO new_purchase_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total_price) VALUES (new_purchase_id, item.product_id, item.quantity, item.unit_price, item_total_price);
    END LOOP;
    RETURN (SELECT row_to_json(p) FROM public.purchases p WHERE p.id = new_purchase_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_with_items(client_id_param UUID, seller_id_param UUID, cost_center_id_param INT, commission_percentage_param NUMERIC, items_param JSONB)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_sale_id UUID; item RECORD; total_amount_calc NUMERIC(10, 2) := 0; item_total_price NUMERIC(10, 2); product_name_temp VARCHAR(255);
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        item_total_price := item.quantity * item.unit_price; total_amount_calc := total_amount_calc + item_total_price;
    END LOOP;
    INSERT INTO public.sales (client_id, seller_id, cost_center_id, total_amount, commission_percentage) VALUES (client_id_param, seller_id_param, cost_center_id_param, total_amount_calc, commission_percentage_param) RETURNING id INTO new_sale_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(items_param) AS x(product_id UUID, quantity NUMERIC(10, 3), unit_price NUMERIC(10, 2)) LOOP
        SELECT name INTO product_name_temp FROM public.products WHERE id = item.product_id;
        item_total_price := item.quantity * item.unit_price;
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price, product_name_snapshot) VALUES (new_sale_id, item.product_id, item.quantity, item.unit_price, item_total_price, product_name_temp);
    END LOOP;
    RETURN (SELECT row_to_json(s) FROM public.sales s WHERE s.id = new_sale_id);
END;
$$;
