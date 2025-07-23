-- =================================================================
-- SCRIPT 29: LIGAÇÃO ENTRE UTILIZADOR E NOME
-- Adiciona a capacidade de associar um registo de autenticação a um
-- registo de entidade (pessoa) para buscar o nome do utilizador.
-- =================================================================

-- 1. ADICIONAR A COLUNA 'user_id' À TABELA 'entities'
-- Esta coluna irá ligar uma pessoa/empresa a uma conta de utilizador.
-- A constraint 'UNIQUE' garante que um utilizador só pode estar ligado a uma entidade.
ALTER TABLE public.entities
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;


-- 2. CRIAR UMA FUNÇÃO COMPLETA PARA BUSCAR O PERFIL DO UTILIZADOR
-- Esta função otimizada busca o papel, o nome, o avatar e as configurações
-- de uma só vez, tornando o login mais eficiente.
CREATE OR REPLACE FUNCTION public.get_full_user_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'role', (SELECT role FROM public.user_roles WHERE user_id = p_user_id),
    'name', (SELECT name FROM public.entities WHERE user_id = p_user_id),
    'avatar_url', (SELECT avatar_url FROM public.user_profiles WHERE user_id = p_user_id),
    'media_settings', (SELECT media_settings FROM public.user_profiles WHERE user_id = p_user_id)
  );
$$;

-- INSTRUÇÃO MANUAL (OPCIONAL, MAS RECOMENDADO):
-- Para que o seu nome apareça, você precisa de ligar o seu registo de utilizador
-- ao seu registo na tabela de entidades.
-- 1. Encontre o seu 'ID' na tabela 'entities'.
-- 2. Encontre o seu 'user_id' na tabela 'auth.users' (ou em 'Authentication' no painel).
-- 3. Execute o comando:
--    UPDATE public.entities SET user_id = 'SEU_USER_ID' WHERE id = 'SEU_ENTITY_ID';
