-- ============================================================
-- Migration 005: Admin via service role + loja Milhaticar + analytics
-- Execute no SQL Editor do Supabase (pode rodar mais de uma vez).
-- ============================================================

-- 1) O admin usa login por cookie (não Supabase Auth): owner_id passa a ser opcional
alter table public.stores alter column owner_id drop not null;

-- 2) Garante que a loja existe
insert into public.stores (slug, name, slogan, whatsapp, address, logo_url)
values (
  'milhaticar',
  'Milhaticar',
  'Certeza de bons negócios',
  '5511994942661',
  'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  '/logo-milhaticar.png'
)
on conflict (slug) do nothing;

-- 3) Tabela de analytics (painel de inteligência)
create table if not exists public.analytics_events (
  id          uuid        primary key default uuid_generate_v4(),
  store_id    uuid        references public.stores(id) on delete cascade not null,
  vehicle_id  uuid        references public.vehicles(id) on delete set null,
  event_type  text        not null,
  source      text        default 'direct',
  created_at  timestamptz default now() not null
);

create index if not exists analytics_store_idx   on public.analytics_events(store_id);
create index if not exists analytics_created_idx on public.analytics_events(created_at);

alter table public.analytics_events enable row level security;
-- Sem policies: só a service role (API routes do servidor) lê/escreve.
