-- ==============================================================================
-- Migration 028: Tabela de Modelos de Respostas de Cláusulas (Fase 3)
-- Permite que cada lojista salve seu conjunto padrão de respostas do questionário.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'venda_veiculo' CHECK (type IN ('venda_veiculo', 'procuracao')),
  name TEXT NOT NULL DEFAULT 'Padrão da Loja',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_store_template_type UNIQUE (store_id, type)
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_store_type
  ON public.contract_templates(store_id, type);

-- Habilita RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contract_templates' 
      AND policyname = 'contract_templates_service_policy'
  ) THEN
    CREATE POLICY contract_templates_service_policy ON public.contract_templates
      FOR ALL USING (true);
  END IF;
END $$;
