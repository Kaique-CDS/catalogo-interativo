-- ============================================================
-- Catalogo Interativo -- Schema inicial
-- Execute no SQL Editor do painel Supabase
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
  owner_id   uuid          references auth.users(id) on delete cascade not null,
  created_at timestamptz   default now() not null
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
  created_at  timestamptz   default now() not null
);

create index if not exists vehicles_store_id_idx on public.vehicles(store_id);

-- ROW LEVEL SECURITY
alter table public.stores   enable row level security;
alter table public.vehicles enable row level security;

-- Stores policies
create policy "Public: read stores"   on public.stores for select using (true);
create policy "Owner: insert store"   on public.stores for insert with check (auth.uid() = owner_id);
create policy "Owner: update store"   on public.stores for update using (auth.uid() = owner_id);

-- Vehicles policies
create policy "Public: read active vehicles"
  on public.vehicles for select
  using (
    is_active = true
    or store_id in (select id from public.stores where owner_id = auth.uid())
  );

create policy "Owner: insert vehicle"
  on public.vehicles for insert
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));

create policy "Owner: update vehicle"
  on public.vehicles for update
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

create policy "Owner: delete vehicle"
  on public.vehicles for delete
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

-- Storage buckets
insert into storage.buckets (id, name, public) values ('vehicles', 'vehicles', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('stores',   'stores',   true) on conflict (id) do nothing;

create policy "Public: read vehicle images"  on storage.objects for select using (bucket_id = 'vehicles');
create policy "Auth: upload vehicle images"  on storage.objects for insert with check (bucket_id = 'vehicles' and auth.role() = 'authenticated');
create policy "Auth: delete vehicle images"  on storage.objects for delete using (bucket_id = 'vehicles'  and auth.role() = 'authenticated');
create policy "Public: read store images"    on storage.objects for select using (bucket_id = 'stores');
create policy "Auth: upload store images"    on storage.objects for insert with check (bucket_id = 'stores'   and auth.role() = 'authenticated');

-- ============================================================
-- SEED: Apos criar um usuario em Authentication > Users, rode:
--
-- insert into public.stores (slug, name, address, whatsapp, owner_id)
-- values (
--   'loja-exemplo',
--   'AutoCenter Premium',
--   'Av. das Nacoes, 1500 - Sao Paulo, SP',
--   '5511999999999',
--   '<uuid-do-usuario-aqui>'
-- );
-- ============================================================
