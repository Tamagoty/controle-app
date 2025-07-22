-- =================================================================
-- SCRIPT 19: FUNÇÕES PARA APAGAR TRANSAÇÕES DE FORMA SEGURA
-- Adiciona as funções RPC para apagar vendas e compras, garantindo
-- que todas as operações associadas (stock, pagamentos) são revertidas.
-- =================================================================

-- 1. Função para apagar uma VENDA e reverter o stock
CREATE OR REPLACE FUNCTION public.delete_sale(p_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    sale_item RECORD;
BEGIN
    -- Para cada item na venda que vai ser apagada, devolve a quantidade ao stock
    FOR sale_item IN
        SELECT product_id, quantity FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        UPDATE public.product_stock
        SET quantity = quantity + sale_item.quantity
        WHERE product_id = sale_item.product_id;
    END LOOP;

    -- Apaga a venda. Graças ao "ON DELETE CASCADE" nas tabelas,
    -- os itens, pagamentos e comissões associados serão apagados automaticamente.
    DELETE FROM public.sales WHERE id = p_sale_id;
END;
$$;


-- 2. Função para apagar uma COMPRA e reverter o stock
CREATE OR REPLACE FUNCTION public.delete_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    purchase_item RECORD;
BEGIN
    -- Para cada item na compra que vai ser apagada, retira a quantidade do stock
    FOR purchase_item IN
        SELECT product_id, quantity FROM public.purchase_items WHERE purchase_id = p_purchase_id
    LOOP
        UPDATE public.product_stock
        SET quantity = quantity - purchase_item.quantity
        WHERE product_id = purchase_item.product_id;
    END LOOP;

    -- Apaga a compra. Os itens e pagamentos associados serão apagados automaticamente.
    DELETE FROM public.purchases WHERE id = p_purchase_id;
END;
$$;
