-- ====================================================================
-- Migration 015: Atualização Cadastral e Normalização de Contatos
-- L&L Multimarcas e Milhaticar (Fonte Única de Dados)
-- ====================================================================

-- 1. Garante que as colunas essenciais existem na tabela stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS maps_embed_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_mobile_url TEXT;

-- 2. Atualiza L&L Multimarcas (ll-multimarcas) com dados oficiais
UPDATE public.stores
SET
  name = 'L&L Multimarcas',
  phone = '(11) 2476-9444',
  whatsapp = '5511967296936',
  whatsapp_financeiro = '5511967296936',
  opening_hours = 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
  address = 'Avenida Marechal Tito, 3921 - Jardim Miragaia, São Paulo - SP, 08160-505',
  instagram = '@lloficial.multimarcas',
  email = 'contato@llmultimarcas.com.br',
  slogan = 'Seminovos com parceria em todos os bancos',
  primary_color = '#4B1F8F',
  contract_razao_social = 'L&L Multimarcas Ltda',
  contract_phone = '(11) 2476-9444',
  contract_address = 'Avenida Marechal Tito, 3921 - Jardim Miragaia, São Paulo - SP, 08160-505',
  contract_email = 'contato@llmultimarcas.com.br',
  contract_foro_cidade = 'São Paulo',
  contract_foro_estado = 'SP'
WHERE slug = 'll-multimarcas';

-- 3. Atualiza Milhaticar (loja-exemplo / milhaticar)
UPDATE public.stores
SET
  name = 'Milhaticar',
  phone = '(11) 4729-4937',
  whatsapp = '5511994942661',
  whatsapp_financeiro = '5511994942661',
  opening_hours = 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
  address = 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  instagram = 'milhaticarsp',
  contract_phone = '(11) 4729-4937',
  contract_address = 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  contract_foro_cidade = 'Mogi das Cruzes',
  contract_foro_estado = 'SP'
WHERE slug IN ('loja-exemplo', 'milhaticar');
