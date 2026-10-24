-- Migration 020: Garantir created_at em vehicles com default now() e not null
-- Executado para suportar métricas de tempo em estoque e ordenação histórica

ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

-- Backfill para veículos legados que eventualmente possuam data nula
UPDATE public.vehicles 
SET created_at = now() 
WHERE created_at IS NULL;

-- Índice para acelerar a ordenação do estoque no admin e na vitrine
CREATE INDEX IF NOT EXISTS vehicles_created_at_idx 
  ON public.vehicles(store_id, created_at DESC);
