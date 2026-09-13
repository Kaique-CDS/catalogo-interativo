-- Migration 002: Novos campos comerciais e opcionais para veículos
alter table public.vehicles 
  add column if not exists fuel text default 'Flex',
  add column if not exists transmission text default 'Automático',
  add column if not exists color text,
  add column if not exists plate_end text,
  add column if not exists features text[] default '{}',
  add column if not exists badge text;

-- Atualizar índices para busca rápida
create index if not exists vehicles_brand_idx on public.vehicles(brand);
create index if not exists vehicles_year_idx on public.vehicles(year);
create index if not exists vehicles_price_idx on public.vehicles(price);