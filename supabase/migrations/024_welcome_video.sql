-- ==============================================================================
-- Migration 024: Welcome Video (Vídeo Institucional Flutuante na Vitrine)
-- Adiciona colunas para vídeo institucional na tabela stores
-- ==============================================================================

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS welcome_video_url text NULL;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS welcome_video_public_id text NULL;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS welcome_video_poster_url text NULL;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS welcome_video_enabled boolean NOT NULL DEFAULT false;

-- Índice para busca rápida de status do vídeo institucional
CREATE INDEX IF NOT EXISTS idx_stores_welcome_video ON public.stores(welcome_video_enabled) WHERE welcome_video_enabled = true;
