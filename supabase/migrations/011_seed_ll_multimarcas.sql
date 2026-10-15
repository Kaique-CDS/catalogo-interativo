-- ============================================================
-- Migration 011: Seed do tenant L&L Multimarcas (ll-multimarcas)
-- Registra a nova loja mantendo o schema inalterado.
-- Idempotente: pode ser executada múltiplas vezes com segurança.
-- ============================================================

INSERT INTO public.stores (
  slug,
  name,
  slogan,
  whatsapp,
  whatsapp_financeiro,
  address,
  logo_url,
  primary_color,
  font_family,
  opening_hours
)
VALUES (
  'll-multimarcas',
  'L&L Multimarcas',
  'Seminovos com parceria em todos os bancos',
  '551123760448',
  '551123760448',
  NULL,
  '/tenants/ll-multimarcas/logo-header.png',
  '#4B1F8F',
  'Inter',
  'Seg a Sex: 09h às 18h | Sáb: 09h às 13h'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  slogan = EXCLUDED.slogan,
  whatsapp = EXCLUDED.whatsapp,
  whatsapp_financeiro = EXCLUDED.whatsapp_financeiro,
  logo_url = EXCLUDED.logo_url,
  primary_color = EXCLUDED.primary_color,
  font_family = EXCLUDED.font_family;
