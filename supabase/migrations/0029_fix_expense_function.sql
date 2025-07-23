-- =================================================================
-- SCRIPT 29: CORREÇÃO DA FUNÇÃO DE DESPESAS E DATA DE PAGAMENTO
-- Resolve o erro de "ambiguidade de função" para despesas e
-- garante que a data do pagamento imediato pode ser definida.
-- =================================================================

-- 1. APAGAR AS FUNÇÕES ANTIGAS E AMBÍGUAS PARA GARANTIR UM ESTADO LIMPO
DROP FUNCTION IF EXISTS public.create_expense_with_details(TEXT, NUMERIC, INT, INT, TIMESTAMPTZ, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.create_expense_with_details(TEXT, NUMERIC, INT, INT, TIMESTAMPTZ, UUID, NUMERIC, TIMESTAMPTZ);


-- 2. RECRIAR A FUNÇÃO DE DESPESA COM TODOS OS PARÂMETROS
CREATE OR REPLACE FUNCTION public.create_expense_with_details(
    description_param TEXT,
    amount_param NUMERIC,
    category_id_param INT,
    cost_center_id_param INT,
    expense_date_param TIMESTAMPTZ,
    employee_id_param UUID,
    payment_amount_param NUMERIC DEFAULT 0,
    payment_date_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_expense_id UUID;
BEGIN
    -- Insere a despesa geral e obtém o seu ID
    INSERT INTO public.general_expenses (description, amount, category_id, cost_center_id, expense_date, employee_id)
    VALUES (description_param, amount_param, category_id_param, cost_center_id_param, expense_date_param, employee_id_param)
    RETURNING id INTO new_expense_id;

    -- Se um valor de pagamento foi fornecido, insere o pagamento com a data correta
    IF payment_amount_param > 0 THEN
        INSERT INTO public.expense_payments (expense_id, amount_paid, payment_date)
        VALUES (new_expense_id, payment_amount_param, payment_date_param);
    END IF;

    -- Retorna o JSON da despesa criada, incluindo o seu ID
    RETURN (SELECT row_to_json(ge) FROM public.general_expenses ge WHERE ge.id = new_expense_id);
END;
$$;
