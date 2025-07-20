-- =================================================================
-- SCRIPT 10: CONFIGURAÇÃO DO UTILIZADOR ADMINISTRADOR
-- Atribui o papel de 'admin' ao seu utilizador para permitir a gestão
-- de outros utilizadores.
-- =================================================================

-- INSTRUÇÕES:
-- 1. Vá para o seu painel Supabase > Authentication.
-- 2. Encontre o seu utilizador na lista e copie o seu "UID".
-- 3. Cole o seu UID no local indicado abaixo, substituindo
--    'COLE_O_SEU_USER_ID_AQUI'.
-- 4. Execute este comando no Editor de SQL do seu projeto.

INSERT INTO public.user_roles (user_id, role)
VALUES ('96429f10-6955-468b-9697-1d13614a6745'::uuid, 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- O comando acima irá:
-- - Inserir o seu utilizador na tabela de papéis com a função 'admin'.
-- - Se o seu utilizador já existir na tabela (por exemplo, com o papel 'vendedor'),
--   ele irá ATUALIZAR o papel para 'admin'.
