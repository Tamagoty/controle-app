-- =================================================================
-- SCRIPT 32: CORREÇÃO DO RETORNO DAS FUNÇÕES DE PAGAMENTO (VERSÃO 2)
-- Altera as funções 'pay_client_debt' e 'pay_supplier_debt' para
-- que retornem o ID do primeiro pagamento criado, resolvendo o bug.
-- =================================================================

-- 1. APAGAR A VERSÃO ANTIGA DA FUNÇÃO 'pay_client_debt'
-- É necessário apagar primeiro, pois estamos a alterar o tipo de retorno da função.
DROP FUNCTION IF EXISTS public.pay_client_debt(uuid, numeric, timestamp with time zone);

-- RECRIAR A FUNÇÃO 'pay_client_debt' COM O RETORNO CORRETO
CREATE OR REPLACE FUNCTION public.pay_client_debt(
    p_client_id UUID,
    p_payment_amount NUMERIC,
    p_payment_date TIMESTAMPTZ DEFAULT NOW()
)
-- Altera o tipo de retorno para uma tabela com o ID do pagamento
RETURNS TABLE(payment_id UUID)
LANGUAGE plpgsql AS $$
DECLARE
    sale_record RECORD;
    payment_to_apply NUMERIC;
    remaining_payment_amount NUMERIC := p_payment_amount;
    first_payment_id UUID := NULL;
    newly_created_payment_id UUID;
BEGIN
    FOR sale_record IN 
        SELECT s.id as sale_id, (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) as balance 
        FROM public.sales s 
        WHERE s.client_id = p_client_id AND (s.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.sale_payments WHERE sale_id = s.id), 0)) > 0 
        ORDER BY s.sale_date ASC 
    LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, sale_record.balance);
        
        -- Insere o pagamento e guarda o ID do primeiro pagamento criado
        INSERT INTO public.sale_payments (sale_id, amount_paid, payment_date) 
        VALUES (sale_record.sale_id, payment_to_apply, p_payment_date)
        RETURNING id INTO newly_created_payment_id;

        IF first_payment_id IS NULL THEN
            first_payment_id := newly_created_payment_id;
        END IF;
        
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;

    -- Retorna a linha com o ID do primeiro pagamento
    RETURN QUERY SELECT first_payment_id;
END;
$$;


-- 2. APAGAR A VERSÃO ANTIGA DA FUNÇÃO 'pay_supplier_debt'
DROP FUNCTION IF EXISTS public.pay_supplier_debt(uuid, numeric, timestamp with time zone);

-- RECRIAR A FUNÇÃO 'pay_supplier_debt' COM O RETORNO CORRETO
CREATE OR REPLACE FUNCTION public.pay_supplier_debt(
    p_supplier_id UUID,
    p_payment_amount NUMERIC,
    p_payment_date TIMESTAMPTZ DEFAULT NOW()
)
-- Altera o tipo de retorno para uma tabela com o ID do pagamento
RETURNS TABLE(payment_id UUID)
LANGUAGE plpgsql AS $$
DECLARE
    purchase_record RECORD;
    payment_to_apply NUMERIC;
    remaining_payment_amount NUMERIC := p_payment_amount;
    first_payment_id UUID := NULL;
    newly_created_payment_id UUID;
BEGIN
    FOR purchase_record IN 
        SELECT p.id as purchase_id, (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) as balance 
        FROM public.purchases p 
        WHERE p.supplier_id = p_supplier_id AND (p.total_amount - COALESCE((SELECT SUM(amount_paid) FROM public.purchase_payments WHERE purchase_id = p.id), 0)) > 0 
        ORDER BY p.purchase_date ASC 
    LOOP
        IF remaining_payment_amount <= 0 THEN EXIT; END IF;
        payment_to_apply := LEAST(remaining_payment_amount, purchase_record.balance);
        
        -- Insere o pagamento e guarda o ID do primeiro pagamento criado
        INSERT INTO public.purchase_payments (purchase_id, amount_paid, payment_date) 
        VALUES (purchase_record.purchase_id, payment_to_apply, p_payment_date)
        RETURNING id INTO newly_created_payment_id;

        IF first_payment_id IS NULL THEN
            first_payment_id := newly_created_payment_id;
        END IF;
        
        remaining_payment_amount := remaining_payment_amount - payment_to_apply;
    END LOOP;

    -- Retorna a linha com o ID do primeiro pagamento
    RETURN QUERY SELECT first_payment_id;
END;
$$;
