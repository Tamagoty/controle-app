-- =================================================================
-- SCRIPT 27: DATAS DE PAGAMENTO EDITÁVEIS NOS FORMULÁRIOS
-- Altera as funções RPC para aceitar uma data de pagamento
-- personalizada nos formulários de Contas a Pagar e a Receber.
-- =================================================================

-- 1. ATUALIZAR A FUNÇÃO 'pay_client_debt'
CREATE OR REPLACE FUNCTION public.pay_client_debt(
    p_client_id UUID,
    p_payment_amount NUMERIC,
    p_payment_date TIMESTAMPTZ DEFAULT NOW() -- Novo parâmetro de data
)
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
        
        -- Insere o pagamento com a data fornecida
        INSERT INTO public.sale_payments (sale_id, amount_paid, payment_date) 
        VALUES (sale_record.sale_id, payment_to_apply, p_payment_date);
        
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
END;
$$;


-- 2. ATUALIZAR A FUNÇÃO 'pay_supplier_debt'
CREATE OR REPLACE FUNCTION public.pay_supplier_debt(
    p_supplier_id UUID,
    p_payment_amount NUMERIC,
    p_payment_date TIMESTAMPTZ DEFAULT NOW() -- Novo parâmetro de data
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    purchase_record RECORD;
    payment_to_apply NUMERIC;
    remaining_payment_amount NUMERIC := p_payment_amount;
BEGIN
    FOR purchase_record IN 
        SELECT p.id as purchase_id, (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) as balance 
        FROM public.purchases p 
        WHERE p.supplier_id = p_supplier_id AND (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) > 0 
        ORDER BY p.purchase_date ASC 
    LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, purchase_record.balance);
        
        -- Insere o pagamento com a data fornecida
        INSERT INTO public.purchase_payments (purchase_id, amount_paid, payment_date) 
        VALUES (purchase_record.purchase_id, payment_to_apply, p_payment_date);
        
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;
END;
$$;
