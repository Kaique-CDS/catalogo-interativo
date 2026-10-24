-- Migration 021: Adicionar coluna old_price na tabela vehicles para técnica De/Por
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS old_price numeric(12, 2) DEFAULT NULL;
