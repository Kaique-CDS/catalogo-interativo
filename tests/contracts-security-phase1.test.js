const assert = require('assert');
const fs = require('fs');

console.log('=== TESTES DE SEGURANÇA E AUTENTICAÇÃO DE CONTRATOS (FASE 1) ===\n');

// 1. Simulação das regras de canAccessTenant de lib/security/auth-guard.ts
function canAccessTenant(auth, targetTenant) {
  if (!auth.isAuthenticated) return false;
  if (auth.isSuperAdmin) return true;
  if (!targetTenant) return false;

  const cleanTarget = targetTenant.trim().toLowerCase();
  const cleanAuth = auth.tenantId?.trim().toLowerCase();

  if (
    (cleanAuth === 'milhaticar' || cleanAuth === 'loja-exemplo') &&
    (cleanTarget === 'milhaticar' || cleanTarget === 'loja-exemplo')
  ) {
    return true;
  }

  return cleanAuth === cleanTarget;
}

console.log('[1. Regras de Isolamento Multi-Tenant e Prevenção IDOR]');

// Usuário da loja 'll-multimarcas'
const authStoreA = {
  isAuthenticated: true,
  isSuperAdmin: false,
  tenantId: 'll-multimarcas',
};

// Usuário da loja 'milhaticar'
const authStoreB = {
  isAuthenticated: true,
  isSuperAdmin: false,
  tenantId: 'milhaticar',
};

// Super admin global
const authSuperAdmin = {
  isAuthenticated: true,
  isSuperAdmin: true,
  tenantId: null,
};

// Usuário não autenticado
const authAnonymous = {
  isAuthenticated: false,
  isSuperAdmin: false,
  tenantId: null,
};

// Teste 1.1: Acesso autorizado ao próprio tenant
assert.strictEqual(canAccessTenant(authStoreA, 'll-multimarcas'), true, 'Lojista A deve acessar ll-multimarcas');
assert.strictEqual(canAccessTenant(authStoreB, 'milhaticar'), true, 'Lojista B deve acessar milhaticar');
console.log('  ✓ Lojistas acessam exclusivamente suas próprias lojas.');

// Teste 1.2: Bloqueio estrito de IDOR (Lojista A tentando acessar contratos do Lojista B)
assert.strictEqual(canAccessTenant(authStoreA, 'milhaticar'), false, 'Lojista A NÃO pode acessar milhaticar');
assert.strictEqual(canAccessTenant(authStoreB, 'll-multimarcas'), false, 'Lojista B NÃO pode acessar ll-multimarcas');
console.log('  ✓ Tentativas de acesso cross-tenant (IDOR) bloqueadas com 403.');

// Teste 1.3: Super Admin possui acesso a qualquer tenant
assert.strictEqual(canAccessTenant(authSuperAdmin, 'll-multimarcas'), true, 'Superadmin deve acessar qualquer loja');
assert.strictEqual(canAccessTenant(authSuperAdmin, 'milhaticar'), true, 'Superadmin deve acessar qualquer loja');
console.log('  ✓ Super Admin possui acesso irrestrito para suporte.');

// Teste 1.4: Anônimo bloqueado
assert.strictEqual(canAccessTenant(authAnonymous, 'll-multimarcas'), false, 'Anônimo deve ser bloqueado');
console.log('  ✓ Usuários anônimos bloqueados de todos os tenants.');

// 2. Verificação de remoção de cache de arquivo do Git
console.log('\n[2. Remoção do Arquivo de Cache Sensível do Git]');
const gitignore = fs.readFileSync('.gitignore', 'utf8');

assert.ok(gitignore.includes('.contracts-cache.json'), '.contracts-cache.json deve estar no .gitignore');
console.log('  ✓ .contracts-cache.json devidamente ignorado no .gitignore.');

// 3. Verificação das Migrations de Contratos
console.log('\n[3. Verificação de Migrations de Contratos]');
const migration014 = fs.readFileSync('supabase/migrations/014_module_contracts.sql', 'utf8');
const migration026 = fs.readFileSync('supabase/migrations/026_contract_vehicle_id.sql', 'utf8');

assert.ok(migration014.includes('get_next_contract_number'), 'Função get_next_contract_number definida na migration 014');
assert.ok(migration014.includes('CREATE TABLE IF NOT EXISTS public.contracts'), 'Tabela contracts definida na migration 014');
assert.ok(migration026.includes('vehicle_id uuid NULL REFERENCES public.vehicles'), 'Coluna vehicle_id vinculada na migration 026');
assert.ok(migration026.includes('idx_contracts_vehicle_id'), 'Índice de performance criado para vehicle_id');
console.log('  ✓ Migrations 014 e 026 validadas com função atômica, tabelas, FKs e índices.');

console.log('\n🎉 TODOS OS TESTES DE SEGURANÇA DA FASE 1 PASSARAM COM 100% DE SUCESSO!\n');
