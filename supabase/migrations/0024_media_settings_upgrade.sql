-- =================================================================
-- SCRIPT 24: MELHORIA DAS CONFIGURAÇÕES DE MÉDIA
-- Adiciona campos mais detalhados para o controlo da qualidade
-- de upload de imagens na tabela de perfis de utilizador.
-- =================================================================

-- Altera a tabela de perfis para garantir que a coluna media_settings existe
-- e define um valor padrão mais completo se a coluna for nova.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS media_settings JSONB DEFAULT '{"image_quality": 0.6, "max_size_mb": 1, "max_width_or_height": 1920}'::jsonb;

-- Para os perfis que já existem e podem ter a configuração antiga,
-- este comando atualiza-os para o novo formato, mantendo a qualidade que já tinham.
UPDATE public.user_profiles
SET media_settings = jsonb_build_object(
    'image_quality', COALESCE((media_settings->>'image_quality')::numeric, 0.6),
    'max_size_mb', 1,
    'max_width_or_height', 1920
)
WHERE jsonb_typeof(media_settings) IS NULL OR media_settings->>'max_size_mb' IS NULL;
