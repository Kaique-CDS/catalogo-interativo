-- ============================================================
-- MIGRATION 007: SUPER ADMIN ERP TABLES (clientes, faturas, logs_auditoria, configuracoes, melhorias)
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

-- Desabilita RLS para uso via server-side / painel administrativo
alter table public.clientes disable row level security;
alter table public.faturas disable row level security;
alter table public.logs_auditoria disable row level security;
alter table public.configuracoes disable row level security;
alter table public.melhorias disable row level security;
