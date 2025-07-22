-- =================================================================
-- SCRIPT 21: FUNÇÃO PARA CRIAR DESPESAS COM PAGAMENTO IMEDIATO
-- Cria a função RPC que permite criar uma despesa e, opcionalmente,
-- registar o primeiro pagamento numa única transação.
-- =================================================================

CREATE OR REPLACE FUNCTION public.create_expense_with_details(
    description_param TEXT,
    amount_param NUMERIC,
    category_id_param INT,
    cost_center_id_param INT,
    expense_date_param TIMESTAMPTZ,
    employee_id_param UUID,
    payment_amount_param NUMERIC DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_expense_id UUID;
BEGIN
    -- Insere a despesa geral e obtém o seu ID
    INSERT INTO public.general_expenses (description, amount, category_id, cost_center_id, expense_date, employee_id)
    VALUES (description_param, amount_param, category_id_param, cost_center_id_param, expense_date_param, employee_id_param)
    RETURNING id INTO new_expense_id;

    -- Se um valor de pagamento foi fornecido, insere o pagamento
    IF payment_amount_param > 0 THEN
        INSERT INTO public.expense_payments (expense_id, amount_paid)
        VALUES (new_expense_id, payment_amount_param);
    END IF;

    -- Retorna o JSON da despesa criada, incluindo o seu ID
    RETURN (SELECT row_to_json(ge) FROM public.general_expenses ge WHERE ge.id = new_expense_id);
END;
$$;
