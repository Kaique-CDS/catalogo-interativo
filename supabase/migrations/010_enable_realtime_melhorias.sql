-- ============================================================
-- Migration 010: Habilitar Supabase Realtime na tabela melhorias
-- ============================================================

-- Adiciona a tabela melhorias na publicação do Realtime se ainda não estiver
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'melhorias'
  ) then
    alter publication supabase_realtime add table public.melhorias;
  end if;
end $$;

-- Garante que REPLICA IDENTITY FULL esteja configurada para que eventos de DELETE
-- enviem todos os dados da linha excluída (incluindo o id) no payload.old
alter table public.melhorias replica identity full;
