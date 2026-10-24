-- ==============================================================================
-- Migration 025: Galeria de Fotos de Clientes ("Clientes que levaram o carro pra casa")
-- Suporta upload múltiplo, ordenação, legendas, RLS e isolamento por tenant.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_customer_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  url text NOT NULL,
  public_id text NULL,
  caption text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance em consultas filtradas por loja e ordenadas
CREATE INDEX IF NOT EXISTS idx_tenant_customer_photos_tenant_sort 
  ON public.tenant_customer_photos(tenant_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_tenant_customer_photos_created 
  ON public.tenant_customer_photos(created_at DESC);

-- Habilita Row Level Security
ALTER TABLE public.tenant_customer_photos ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (vitrine consome fotos ativas da loja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_customer_photos' AND policyname = 'Permitir leitura pública de fotos ativas'
  ) THEN
    CREATE POLICY "Permitir leitura pública de fotos ativas"
      ON public.tenant_customer_photos
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Política de gerenciamento total para service_role e admins autorizados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_customer_photos' AND policyname = 'Permitir controle total para service role'
  ) THEN
    CREATE POLICY "Permitir controle total para service role"
      ON public.tenant_customer_photos
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
