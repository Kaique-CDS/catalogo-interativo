-- ============================================================
-- Migration 008: Colunas de fotos e capa na tabela vehicles
-- ============================================================

alter table public.vehicles
  add column if not exists fotos jsonb default '[]'::jsonb,
  add column if not exists fotos_urls text[] default '{}'::text[],
  add column if not exists foto_capa_url text;
