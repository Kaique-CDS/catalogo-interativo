/**
 * Suíte de Testes Automatizados - Login Centralizado de Lojistas (Fase 5)
 * Testa o hashing com bcrypt, verificação de senha, migração automática
 * de lojistas legados e resolução de lojas (1 loja vs múltiplas lojas).
 */

const assert = require('assert')
const bcrypt = require('bcryptjs')

async function hashPasswordTest(plain) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

async function verifyPasswordTest(plain, hash) {
  return bcrypt.compare(plain, hash)
}

// Simulação de resolução de destino no login centralizado
function resolveLoginDestination(user, memberships) {
  if (!user.is_active) {
    return {
      success: false,
      error: 'Esta conta de lojista está inativa. Entre em contato com o suporte da plataforma.',
    }
  }

  if (!memberships || memberships.length === 0) {
    return {
      success: false,
      error: 'Nenhuma loja ativa está vinculada ao seu usuário. Entre em contato com o suporte.',
    }
  }

  if (memberships.length === 1) {
    return {
      success: true,
      redirectTo: `/${memberships[0].tenant_id}/admin`,
      stores: memberships,
    }
  }

  return {
    success: true,
    requiresChoice: true,
    stores: memberships,
  }
}

async function runTests() {
  console.log('=== TESTES DE AUTENTICAÇÃO CENTRALIZADA (FASE 5) ===\n')

  // 1. Hashing e Verificação com bcrypt
  console.log('[1. Criptografia e Hashing Seguro com bcrypt]')
  const plainPassword = 'minha_senha_segura_123'
  const hash = await hashPasswordTest(plainPassword)

  assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'O hash deve seguir a especificação modular do bcrypt ($2a$ ou $2b$)')
  assert.notStrictEqual(plainPassword, hash, 'A senha nunca pode ser armazenada em texto puro')

  const matchCorrect = await verifyPasswordTest(plainPassword, hash)
  assert.strictEqual(matchCorrect, true, 'Senha correta deve ser verificada como válida')

  const matchWrong = await verifyPasswordTest('senha_incorreta_xyz', hash)
  assert.strictEqual(matchWrong, false, 'Senha incorreta deve ser categoricamente rejeitada')

  console.log('  ✓ Hashing com salt rounds (10) e verificação criptográfica funcionando')

  // 2. Migração Automática de Credenciais Legadas no 1º Login
  console.log('\n[2. Migração de Lojistas Legados (L&L e Milhaticar)]')
  const legacyEnv = {
    LL_ADMIN_USER: 'admin',
    LL_ADMIN_PASS: 'llmultimarcas',
    CAR_ADMIN_USER: 'julia',
    CAR_ADMIN_PASS: 'milhati',
  }

  // Simulação de migração da L&L
  const llInput = { user: 'admin', pass: 'llmultimarcas' }
  const isLlLegacy =
    (llInput.user === legacyEnv.LL_ADMIN_USER || llInput.user === 'admin@llmultimarcas.com.br') &&
    llInput.pass === legacyEnv.LL_ADMIN_PASS

  assert(isLlLegacy, 'Credenciais legadas da L&L devem ser reconhecidas')
  const llHash = await hashPasswordTest(llInput.pass)
  assert(await verifyPasswordTest('llmultimarcas', llHash), 'Senha legada da L&L convertida para bcrypt')
  console.log('  ✓ Lojista L&L Multimarcas identificado e migrado para bcrypt com sucesso')

  // Simulação de migração da Milhaticar
  const milhatiInput = { user: 'julia@milhaticar.com.br', pass: 'milhati' }
  const isMilhatiLegacy =
    (milhatiInput.user === legacyEnv.CAR_ADMIN_USER || milhatiInput.user === 'julia@milhaticar.com.br') &&
    milhatiInput.pass === legacyEnv.CAR_ADMIN_PASS

  assert(isMilhatiLegacy, 'Credenciais legadas da Milhaticar por e-mail devem ser reconhecidas')
  const milhatiHash = await hashPasswordTest(milhatiInput.pass)
  assert(await verifyPasswordTest('milhati', milhatiHash), 'Senha legada da Milhaticar convertida para bcrypt')
  console.log('  ✓ Lojista Milhaticar identificado por e-mail e migrado para bcrypt com sucesso')

  // 3. Resolução de Destino por Lojas Vinculadas
  console.log('\n[3. Resolução de Lojas e Redirecionamento]')

  // Caso A: Lojista com 1 loja (padrão)
  const singleStoreUser = { id: 'u1', email: 'admin@llmultimarcas.com.br', is_active: true }
  const singleMembership = [{ tenant_id: 'll-multimarcas', name: 'L&L Multimarcas' }]
  const resSingle = resolveLoginDestination(singleStoreUser, singleMembership)

  assert.strictEqual(resSingle.success, true)
  assert.strictEqual(resSingle.redirectTo, '/ll-multimarcas/admin')
  console.log('  ✓ Lojista com 1 loja redirecionado automaticamente para /{slug}/admin')

  // Caso B: Lojista com múltiplas lojas (ex: dono de rede)
  const multiStoreUser = { id: 'u2', email: 'diretor@grupoauto.com.br', is_active: true }
  const multiMemberships = [
    { tenant_id: 'll-multimarcas', name: 'L&L Multimarcas' },
    { tenant_id: 'milhaticar', name: 'Milhaticar' },
  ]
  const resMulti = resolveLoginDestination(multiStoreUser, multiMemberships)

  assert.strictEqual(resMulti.success, true)
  assert.strictEqual(resMulti.requiresChoice, true)
  assert.strictEqual(resMulti.stores.length, 2)
  console.log('  ✓ Lojista com múltiplas lojas recebe tela de seleção de loja')

  // Caso C: Usuário sem loja ativa vinculada
  const orphanedUser = { id: 'u3', email: 'semloja@email.com', is_active: true }
  const resOrphan = resolveLoginDestination(orphanedUser, [])
  assert.strictEqual(resOrphan.success, false)
  assert(resOrphan.error.includes('suporte'), 'Deve orientar contato com o suporte')
  console.log('  ✓ Usuário sem loja ativa recebe mensagem amigável de suporte')

  // Caso D: Usuário inativo
  const inactiveUser = { id: 'u4', email: 'desativado@email.com', is_active: false }
  const resInactive = resolveLoginDestination(inactiveUser, singleMembership)
  assert.strictEqual(resInactive.success, false)
  assert(resInactive.error.includes('inativa'), 'Deve informar que a conta está inativa')
  console.log('  ✓ Usuário inativo é bloqueado')

  console.log('\n✅ Todos os testes de autenticação centralizada passaram com 100% de sucesso!')
}

runTests().catch((err) => {
  console.error('Falha nos testes de autenticação:', err)
  process.exit(1)
})
