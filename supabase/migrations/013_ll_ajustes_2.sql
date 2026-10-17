-- ====================================================================
-- Migration 013: L&L Multimarcas Ajustes 2 (Tenant: ll-multimarcas)
-- ====================================================================

-- 1. Colunas adicionais na tabela stores (idempotentes, aditivas e nullable)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS maps_embed_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_mobile_url TEXT;

-- 2. Colunas adicionais na tabela analytics_events para rastreio dinâmico
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS source_detail TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS referrer_host TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 3. Atualização cadastral da L&L Multimarcas (isolada estritamente no slug 'll-multimarcas')
UPDATE public.stores
SET
  address = 'Avenida Marechal Tito, 3921 - Jardim Miragaia, São Paulo - SP, 08160-505',
  phone = '(11) 2376-0448',
  banner_url = NULL,
  banner_mobile_url = NULL
WHERE slug = 'll-multimarcas';
