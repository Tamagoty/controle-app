-- =================================================================
-- SCRIPT 30: FUNÇÃO PARA O UTILIZADOR ATUALIZAR O SEU NOME
-- Cria a função RPC que permite a um utilizador logado definir ou
-- atualizar o seu nome na tabela de entidades.
-- =================================================================

CREATE OR REPLACE FUNCTION public.update_my_name(new_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios elevados para poder criar a entidade se necessário
AS $$
DECLARE
    entity_record_id UUID;
    auth_user_id UUID := auth.uid();
    auth_user_email TEXT := (SELECT email FROM auth.users WHERE id = auth_user_id);
BEGIN
    -- Verifica se já existe uma entidade ligada a este utilizador
    SELECT id INTO entity_record_id FROM public.entities WHERE user_id = auth_user_id;

    IF entity_record_id IS NOT NULL THEN
        -- Se existe, simplesmente atualiza o nome
        UPDATE public.entities
        SET name = new_name
        WHERE id = entity_record_id;
    ELSE
        -- Se não existe, cria uma nova entidade e liga-a ao utilizador
        INSERT INTO public.entities (name, email, entity_type, user_id)
        VALUES (new_name, auth_user_email, 'Pessoa', auth_user_id)
        RETURNING id INTO entity_record_id;

        -- Opcional, mas recomendado: Atribui um papel padrão de 'Funcionário'
        -- a esta nova entidade, para que ela apareça nas listas corretas.
        INSERT INTO public.entity_roles (entity_id, role)
        VALUES (entity_record_id, 'Funcionário')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;
