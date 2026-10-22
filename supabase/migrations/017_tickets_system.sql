-- Migration 017: Sistema de Tickets, Anexos e Eventos de Status
-- Substitui o módulo legado de anotações por tickets com isolamento por tenant,
-- histórico de status, devolutiva do super-admin e gerenciamento de prints no Cloudinary.

-- 1. Tabela Principal de Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  ticket_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('melhoria', 'problema', 'duvida')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido')),
  resolution_note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  prints_deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_tenant_ticket_number UNIQUE (tenant_id, ticket_number)
);

-- 2. Tabela de Anexos (Prints do Cloudinary)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  public_id TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Histórico de Eventos do Ticket
CREATE TABLE IF NOT EXISTS ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices para Otimização de Consultas e RLS
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id);

-- 5. Função para gerar o próximo número sequencial de ticket por empresa (atômico)
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_tenant_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  INTO next_num
  FROM tickets
  WHERE tenant_id = p_tenant_id;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;
