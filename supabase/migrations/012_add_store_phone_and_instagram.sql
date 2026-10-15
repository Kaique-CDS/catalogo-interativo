-- ============================================================
-- Migration 012: Adicionar campos de telefone de ligações e instagram à tabela stores
-- Permite configurar número exclusivo para receber chamadas e URL do Instagram.
-- Idempotente: pode ser executada múltiplas vezes com segurança.
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Atualiza dados iniciais da L&L Multimarcas com seu telefone de televendas e Instagram
UPDATE public.stores
SET
  phone = COALESCE(phone, '(11) 2376-0448'),
  instagram = COALESCE(instagram, 'https://www.instagram.com/lloficialmultimarcas/')
WHERE slug = 'll-multimarcas';

-- Atualiza dados da Milhaticar
UPDATE public.stores
SET
  phone = COALESCE(phone, '(11) 4729-4937'),
  instagram = COALESCE(instagram, 'https://instagram.com/milhaticarsp')
WHERE slug IN ('milhaticar', 'loja-exemplo');
