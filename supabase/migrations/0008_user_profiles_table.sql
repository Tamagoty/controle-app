-- =================================================================
-- SCRIPT 8: TABELA DE PERFIS DE UTILIZADOR (PARA TEMAS)
-- Cria a tabela para armazenar configurações personalizadas por utilizador.
-- =================================================================

-- 1. Criar a tabela para guardar as preferências
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_settings JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ativar a Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Segurança
-- Permite que cada utilizador leia e modifique apenas o seu próprio perfil.
CREATE POLICY "Allow individual user access to their own profile"
ON public.user_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_update
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION handle_profile_update();
