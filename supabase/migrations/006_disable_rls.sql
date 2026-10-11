-- ============================================================
-- Migration 006: Desabilitar temporariamente RLS para permitir Admin via Cookie
-- Como a autenticação atual não usa o Supabase Auth oficial (e sim cookies de sessão do Next.js),
-- a role que acessa o banco via API é sempre "anon".
-- Se você não configurou a SUPABASE_SERVICE_ROLE_KEY no Vercel, precisamos liberar
-- a gravação pública para a API funcionar.
-- ============================================================

-- Desabilita restrições RLS (Apenas para esse modelo de login via cookie/senha fixa)
alter table public.stores disable row level security;
alter table public.vehicles disable row level security;
alter table public.analytics_events disable row level security;

-- Se no futuro quiser voltar a usar RLS, basta "enable row level security" e configurar as chaves.
