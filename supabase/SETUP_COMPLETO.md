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

-- ============================================================
-- PAINEL SUPER ADMIN (ERP)
-- ============================================================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome_loja text not null,
  email text not null,
  cnpj text,
  plano text not null check (plano in ('basico','medio','premium','trial')),
  status text not null default 'ativo' check (status in ('ativo','inativo','trial')),
  uso_banco_mb numeric default 0,
  data_vencimento date not null,
  created_at timestamptz default now()
);

create table if not exists public.faturas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  valor numeric not null,
  status text not null default 'pendente' check (status in ('pago','atrasado','pendente','trial')),
  vencimento date not null,
  pago_em timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.logs_auditoria (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('login','cadastro','edicao','exclusao','erro','sistema')),
  criticidade text default 'normal' check (criticidade in ('normal','critico')),
  descricao text not null,
  ator text,
  ip text,
  created_at timestamptz default now()
);

create table if not exists public.configuracoes (
  id int primary key default 1,
  nome_plataforma text default 'VendaZap',
  email_suporte text default 'suporte@vendazap.com',
  whatsapp_suporte text default '5511993270543',
  dias_trial int default 7,
  limite_carros_starter int default 20,
  limite_carros_premium int default 40,
  limite_carros_enterprise int default 100,
  emails_cobranca_ativo boolean default true,
  constraint single_row check (id = 1)
);
insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

create table if not exists public.melhorias (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('urgente','feature','bug','analise')),
  titulo text not null,
  descricao text,
  created_at timestamptz default now()
);

alter table public.clientes disable row level security;
alter table public.faturas disable row level security;
alter table public.logs_auditoria disable row level security;
alter table public.configuracoes disable row level security;
alter table public.melhorias disable row level security;
```
