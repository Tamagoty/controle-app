-- =================================================================
-- SCRIPT 9: AJUSTES EM FORMULÁRIOS E FUNÇÕES
-- Torna campos opcionais e adiciona a data de criação ao centro de custo.
-- =================================================================

-- 1. Altera a tabela de centros de custo para não usar DEFAULT NOW()
--    Isto permite que a data seja definida pelo frontend.
ALTER TABLE public.cost_centers
ALTER COLUMN created_at DROP DEFAULT;

-- 2. Atualiza a função para criar entidades, tratando campos vazios como NULL.
CREATE OR REPLACE FUNCTION public.create_entity_with_roles(name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    new_entity_id UUID; role_item TEXT;
BEGIN
    INSERT INTO public.entities (name, email, phone, document_number, address, entity_type) VALUES (
      name_param,
      NULLIF(TRIM(email_param), ''),
      NULLIF(TRIM(phone_param), ''),
      NULLIF(TRIM(document_number_param), ''),
      NULLIF(TRIM(address_param), ''),
      entity_type_param
    ) RETURNING id INTO new_entity_id;
    IF array_length(roles_param, 1) > 0 THEN
        FOREACH role_item IN ARRAY roles_param LOOP
            INSERT INTO public.entity_roles (entity_id, role) VALUES (new_entity_id, role_item);
        END LOOP;
    END IF;
    RETURN (SELECT row_to_json(e) FROM public.entities e WHERE e.id = new_entity_id);
END;
$$;

-- 3. Atualiza a função para editar entidades, tratando campos vazios como NULL.
CREATE OR REPLACE FUNCTION public.update_entity_with_roles(entity_id_param UUID, name_param TEXT, email_param TEXT, phone_param TEXT, document_number_param TEXT, address_param TEXT, entity_type_param TEXT, roles_param TEXT[])
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    role_item TEXT;
BEGIN
    UPDATE public.entities SET
      name = name_param,
      email = NULLIF(TRIM(email_param), ''),
      phone = NULLIF(TRIM(phone_param), ''),
      document_number = NULLIF(TRIM(document_number_param), ''),
      address = NULLIF(TRIM(address_param), ''),
      entity_type = entity_type_param
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
