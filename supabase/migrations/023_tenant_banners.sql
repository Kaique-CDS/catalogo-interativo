-- ==============================================================================
-- Migration 023: Tenant Banners (Múltiplos Banners Desktop/Mobile com Imagem e Vídeo)
-- Suporta carrossel, reordenação, links opcionais e backfill retrocompatível.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  device text NOT NULL CHECK (device IN ('desktop', 'mobile')),
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  url text NOT NULL,
  public_id text NULL,
  poster_url text NULL,
  link_url text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas por loja, dispositivo e ordenação
CREATE INDEX IF NOT EXISTS idx_tenant_banners_tenant_device ON public.tenant_banners(tenant_id, device, sort_order);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_active ON public.tenant_banners(tenant_id, is_active);

-- Habilita RLS
ALTER TABLE public.tenant_banners ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (vitrine consome banners ativos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_banners' AND policyname = 'Permitir leitura pública de banners ativos'
  ) THEN
    CREATE POLICY "Permitir leitura pública de banners ativos"
      ON public.tenant_banners
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Política de gestão total para service_role e administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_banners' AND policyname = 'Permitir controle total para service role'
  ) THEN
    CREATE POLICY "Permitir controle total para service role"
      ON public.tenant_banners
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- BACKFILL: Migrar banners existentes em stores para tenant_banners sem duplicações
-- ==============================================================================

-- 1. Banners Desktop existentes
INSERT INTO public.tenant_banners (tenant_id, device, media_type, url, sort_order, is_active)
SELECT 
  s.id,
  'desktop',
  'image',
  s.banner_url,
  0,
  true
FROM public.stores s
WHERE s.banner_url IS NOT NULL 
  AND trim(s.banner_url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_banners tb 
    WHERE tb.tenant_id = s.id AND tb.device = 'desktop' AND tb.url = s.banner_url
  );

-- 2. Banners Mobile existentes
INSERT INTO public.tenant_banners (tenant_id, device, media_type, url, sort_order, is_active)
SELECT 
  s.id,
  'mobile',
  'image',
  s.banner_mobile_url,
  0,
  true
FROM public.stores s
WHERE s.banner_mobile_url IS NOT NULL 
  AND trim(s.banner_mobile_url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_banners tb 
    WHERE tb.tenant_id = s.id AND tb.device = 'mobile' AND tb.url = s.banner_mobile_url
  );
