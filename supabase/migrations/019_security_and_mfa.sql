-- Migration 019: Segurança, MFA (TOTP) e Bloqueio contra Força Bruta
-- Data: 2026-10-22
--
-- PLANO DE ROLLBACK:
-- ALTER TABLE store_users DROP COLUMN IF EXISTS totp_secret;
-- ALTER TABLE store_users DROP COLUMN IF EXISTS totp_enabled;
-- ALTER TABLE store_users DROP COLUMN IF EXISTS failed_login_attempts;
-- ALTER TABLE store_users DROP COLUMN IF EXISTS locked_until;

-- 1. Adiciona suporte a MFA / 2FA via TOTP (RFC 6238)
ALTER TABLE store_users
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- 2. Adiciona campos de rastreamento de tentativas de login e bloqueio temporário
ALTER TABLE store_users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 3. Índice para performance em checagem de bloqueio
CREATE INDEX IF NOT EXISTS idx_store_users_locked_until ON store_users(locked_until);
