-- ====================================================================
-- Migration 016: Governança de IA (Contador de Uso e Trava Global)
-- Proteção contra qualquer cobrança: cota 100% gratuita com trava de 70%
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  date TEXT NOT NULL,
  minute TEXT NOT NULL,
  calls_count INT DEFAULT 1,
  tokens_estimated INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON public.ai_usage (date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_minute ON public.ai_usage (minute);

CREATE TABLE IF NOT EXISTS public.ai_system_lock (
  id INT PRIMARY KEY DEFAULT 1,
  disabled_until TIMESTAMPTZ,
  reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.ai_system_lock (id, disabled_until, reason)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
