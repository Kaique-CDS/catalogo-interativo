-- ============================================================
-- Migration 009: Suporte e documentação de public_id na coluna fotos
-- ============================================================

-- Garante que a coluna fotos exista na tabela vehicles (jsonb)
alter table public.vehicles
  add column if not exists fotos jsonb default '[]'::jsonb,
  add column if not exists fotos_urls text[] default '{}'::text[],
  add column if not exists foto_capa_url text;

-- Comentário explicativo sobre a estrutura esperada:
-- [
--   {
--     "url": "https://res.cloudinary.com/...",
--     "public_id": "milhaticar/veiculos/toyota/123/xyz",
--     "is_capa": true
--   }
-- ]
-- Fotos antigas sem public_id permanecem válidas e não são afetadas.
