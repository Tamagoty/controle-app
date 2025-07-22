-- =================================================================
-- SCRIPT 23: AVATAR DO UTILIZADOR E CONFIGURAÇÕES DE MÉDIA
-- Adiciona a capacidade de os utilizadores terem um avatar e
-- configurarem a qualidade de upload de imagens.
-- =================================================================

-- 1. ALTERAR A TABELA DE PERFIS PARA INCLUIR NOVOS CAMPOS
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS media_settings JSONB;


-- 2. CRIAR O BUCKET DE ARMAZENAMENTO (STORAGE) PARA AVATARES
-- O bucket 'avatars' irá guardar as imagens de perfil.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) -- Avatares são públicos para fácil acesso
ON CONFLICT (id) DO NOTHING;


-- 3. CRIAR POLÍTICAS DE SEGURANÇA PARA O BUCKET 'avatars'
-- Estas regras controlam quem pode fazer upload, ver ou apagar os avatares.

-- Permite que qualquer pessoa veja os avatares (necessário para os exibir na app).
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Permite que um utilizador autenticado insira (faça upload) do seu próprio avatar.
-- A segurança é reforçada por uma função no frontend que garante que o path do ficheiro
-- corresponde ao ID do utilizador.
CREATE POLICY "Allow authenticated users to insert their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Permite que um utilizador autenticado atualize o seu próprio avatar.
CREATE POLICY "Allow authenticated users to update their own avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Permite que um utilizador autenticado apague o seu próprio avatar.
CREATE POLICY "Allow authenticated users to delete their own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);
