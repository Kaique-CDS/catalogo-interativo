-- ====================================================================
-- Migration 014: Módulo de Contratos e Documentos Jurídicos
-- ====================================================================

-- 1. Colunas adicionais na tabela stores para habilitação do módulo e dados jurídicos
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"contracts": false}'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contracts_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_razao_social TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_cnpj TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_address TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_email TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_foro_cidade TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_foro_estado TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_rep_nome TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_rep_cpf TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS contract_signature_url TEXT;

-- 2. Tabela de contadores atômicos por tenant para numeração sequencial sem duplicação
CREATE TABLE IF NOT EXISTS public.contract_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('venda', 'procuracao')),
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_store_contract_counter UNIQUE (store_id, type)
);

-- Função atômica para obter próximo número sequencial
CREATE OR REPLACE FUNCTION public.get_next_contract_number(p_store_id UUID, p_type TEXT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO public.contract_counters (store_id, type, last_number, updated_at)
  VALUES (p_store_id, p_type, 1, now())
  ON CONFLICT (store_id, type)
  DO UPDATE SET
    last_number = public.contract_counters.last_number + 1,
    updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- 3. Tabela mestre de contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  sequential_number INT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('venda', 'procuracao')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_signed', 'signed', 'canceled')),
  buyer_type TEXT NOT NULL CHECK (buyer_type IN ('pf', 'pj')),
  buyer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  seller_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations TEXT,
  delivery_days INT DEFAULT 5,
  down_payment NUMERIC DEFAULT 0,
  transfer_responsible TEXT DEFAULT 'comprador',
  warranty_text TEXT,
  crlv_data JSONB,
  crlv_file_url TEXT,
  print_pdf_url TEXT,
  signed_pdf_url TEXT,
  pdf_sha256 TEXT,
  is_manual_signed BOOLEAN DEFAULT false,
  manual_signed_file_url TEXT,
  manual_signed_by TEXT,
  manual_signed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  canceled_reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de signatários
CREATE TABLE IF NOT EXISTS public.contract_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'outorgante', 'outorgado')),
  name TEXT NOT NULL,
  document TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired')),
  signed_at TIMESTAMPTZ,
  signature_image_url TEXT,
  ip TEXT,
  user_agent TEXT,
  otp_code_hash TEXT,
  otp_sent_at TIMESTAMPTZ,
  otp_attempts INT DEFAULT 0,
  otp_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de trilha de auditoria e evidências
CREATE TABLE IF NOT EXISTS public.contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES public.contract_signers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'otp_sent', 'otp_verified', 'otp_failed', 'signed', 'manual_signed', 'canceled', 'deleted', 'pdf_generated')),
  ip TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de modelos de cláusulas da empresa
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('venda', 'procuracao')),
  title TEXT NOT NULL,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de performance para busca rápida
CREATE INDEX IF NOT EXISTS idx_contracts_store_id ON public.contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON public.contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON public.contracts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contract_signers_contract_id ON public.contract_signers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signers_token_hash ON public.contract_signers(token_hash);
CREATE INDEX IF NOT EXISTS idx_contract_events_contract_id ON public.contract_events(contract_id);

-- Desabilita RLS para alinhamento com a arquitetura atual de server-side admin client
ALTER TABLE public.contract_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates DISABLE ROW LEVEL SECURITY;
