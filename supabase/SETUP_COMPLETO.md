```sql
-- ============================================================
-- CATÁLOGO INTERATIVO - SETUP COMPLETO DO BANCO DE DADOS
-- 
-- PASSO A PASSO:
-- 1. Abra o painel do seu Supabase
-- 2. No menu esquerdo, clique em "SQL Editor"
-- 3. Clique em "New Query"
-- 4. Cole TODO este código lá dentro e clique em "RUN"
-- ============================================================

create extension if not exists "uuid-ossp";

-- TABELA: stores
create table if not exists public.stores (
  id         uuid          primary key default uuid_generate_v4(),
  slug       text          unique not null,
  name       text          not null,
  logo_url   text,
  address    text,
  whatsapp   text          not null,
  owner_id   uuid          references auth.users(id) on delete cascade,
  created_at timestamptz   default now() not null,
  whatsapp_financeiro text,
  opening_hours text DEFAULT 'Seg a Sex: 09h às 18h',
  primary_color TEXT DEFAULT '#18181B',
  font_family TEXT DEFAULT 'Inter',
  slogan TEXT,
  banner_url TEXT
);

create index if not exists stores_slug_idx     on public.stores(slug);
create index if not exists stores_owner_id_idx on public.stores(owner_id);

-- TABELA: vehicles
create table if not exists public.vehicles (
  id          uuid          primary key default uuid_generate_v4(),
  store_id    uuid          references public.stores(id) on delete cascade not null,
  title       text          not null,
  brand       text          not null,
  model       text          not null,
  year        integer       not null,
  mileage     integer       not null default 0,
  price       numeric(12,2) not null,
  description text,
  images      text[]        default '{}',
  is_active   boolean       not null default true,
  created_at  timestamptz   default now() not null,
  fuel text default 'Flex',
  transmission text default 'Automático',
  color text,
  plate_end text,
  features text[] default '{}',
  badge text,
  sku text unique
);

create index if not exists vehicles_store_id_idx on public.vehicles(store_id);
create index if not exists vehicles_brand_idx on public.vehicles(brand);
create index if not exists vehicles_year_idx on public.vehicles(year);
create index if not exists vehicles_price_idx on public.vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_sku ON public.vehicles(sku);

-- TABELA: analytics_events
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

-- ROW LEVEL SECURITY: Desabilitado (Acesso via Cookie e Servidor)
alter table public.stores disable row level security;
alter table public.vehicles disable row level security;
alter table public.analytics_events disable row level security;

-- Storage buckets (Opcional, já que as fotos estão indo pro Cloudinary)
insert into storage.buckets (id, name, public) values ('vehicles', 'vehicles', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('stores',   'stores',   true) on conflict (id) do nothing;

```
