-- Migration 018: Autenticação Centralizada de Lojistas com Hashing Seguro (bcrypt)
-- Permite login unificado em /entrar, descobrindo automaticamente a loja do lojista
-- e suportando múltiplos vínculos de lojas e senhas com hash criptográfico.

-- 1. Tabela de Usuários das Lojas
CREATE TABLE IF NOT EXISTS store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. Tabela de Associação Usuário <-> Loja (Tenant)
CREATE TABLE IF NOT EXISTS store_user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES store_users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id)
);

-- 3. Índices para Pesquisa Rápida e Case-Insensitive
CREATE INDEX IF NOT EXISTS idx_store_users_email_lower ON store_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_store_users_username_lower ON store_users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_store_user_memberships_user_id ON store_user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_store_user_memberships_tenant ON store_user_memberships(tenant_id);
