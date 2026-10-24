-- ==============================================================================
-- Migration 027: Tabela de Rascunhos Automáticos de Contratos (Fase 2)
-- Idempotente, com RLS, índices e controle de versão por tenant/tipo.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contract_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('venda_veiculo', 'procuracao')),
  step INT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_store_draft_type UNIQUE (store_id, type)
);

CREATE INDEX IF NOT EXISTS idx_contract_drafts_store_type 
  ON public.contract_drafts(store_id, type);

CREATE INDEX IF NOT EXISTS idx_contract_drafts_updated_at 
  ON public.contract_drafts(updated_at);

-- Habilita RLS
ALTER TABLE public.contract_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contract_drafts' 
      AND policyname = 'contract_drafts_service_policy'
  ) THEN
    CREATE POLICY contract_drafts_service_policy ON public.contract_drafts
      FOR ALL USING (true);
  END IF;
END $$;
