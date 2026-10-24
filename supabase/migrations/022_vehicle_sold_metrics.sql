-- Migration 022: Adicionar status e sold_at para métricas de tempo até a venda no dashboard
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'disponivel' 
  CHECK (status IN ('disponivel', 'vendido', 'reservado'));

ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NULL;

-- Índices para performance e consultas por loja
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(store_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_sold_at ON public.vehicles(store_id, sold_at DESC);
