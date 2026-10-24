const assert = require('assert')
const { getTempoEmEstoque } = require('./date-utils.cjs')

console.log('=== TESTES DE DATA DE CADASTRO E TEMPO EM ESTOQUE (PROMPT 4) ===\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✗ FALHA em "${name}":`, err.message)
  }
}

// 1. Testes de cálculo de dias e texto amigável
console.log('[1. Cálculo de Tempo em Estoque e Amigabilidade pt-BR]')

test('Data de hoje deve retornar "hoje" e "Hoje" com 0 dias', () => {
  const now = new Date()
  const res = getTempoEmEstoque(now)
  assert.strictEqual(res.days, 0)
  assert.strictEqual(res.relative, 'hoje')
  assert.strictEqual(res.compact, 'Hoje')
})

test('Data de 1 dia atrás deve retornar "há 1 dia" e "1 dia"', () => {
  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24)
  const res = getTempoEmEstoque(yesterday)
  assert.strictEqual(res.days, 1)
  assert.strictEqual(res.relative, 'há 1 dia')
  assert.strictEqual(res.compact, '1 dia')
})

test('Data de 12 dias atrás deve retornar "há 12 dias" e "12 dias"', () => {
  const daysAgo12 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
  const res = getTempoEmEstoque(daysAgo12)
  assert.strictEqual(res.days, 12)
  assert.strictEqual(res.relative, 'há 12 dias')
  assert.strictEqual(res.compact, '12 dias')
})

test('Data de 45 dias atrás deve retornar "há 1 mês"', () => {
  const daysAgo45 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45)
  const res = getTempoEmEstoque(daysAgo45)
  assert.strictEqual(res.days, 45)
  assert.strictEqual(res.relative, 'há 1 mês')
  assert.strictEqual(res.compact, '1 mês')
})

test('Data de 95 dias atrás deve retornar "há 3 meses"', () => {
  const daysAgo95 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 95)
  const res = getTempoEmEstoque(daysAgo95)
  assert.strictEqual(res.relative, 'há 3 meses')
  assert.strictEqual(res.compact, '3 meses')
})

test('Data de 400 dias atrás deve retornar "há 1 ano"', () => {
  const daysAgo400 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 400)
  const res = getTempoEmEstoque(daysAgo400)
  assert.strictEqual(res.relative, 'há 1 ano')
  assert.strictEqual(res.compact, '1 ano')
})

test('Data nula ou undefined não quebra e retorna fallback seguro', () => {
  const resNull = getTempoEmEstoque(null)
  assert.ok(resNull.dateBr)
  assert.strictEqual(resNull.relative, 'hoje')

  const resUndef = getTempoEmEstoque(undefined)
  assert.ok(resUndef.dateBr)
  assert.strictEqual(resUndef.relative, 'hoje')
})

// 2. Testes de Ordenação por Data de Cadastro
console.log('\n[2. Ordenação por Data de Cadastro (Mais Recentes vs Mais Antigos)]')

const mockVehicles = [
  { id: '1', title: 'Carro B (3 dias)', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: '2', title: 'Carro A (Hoje)', created_at: new Date().toISOString() },
  { id: '3', title: 'Carro C (30 dias)', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: '4', title: 'Carro D (Sem data)', created_at: null },
]

test('Ordenação "recent" deve colocar o mais novo primeiro', () => {
  const sorted = [...mockVehicles].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return timeB - timeA
  })
  assert.strictEqual(sorted[0].id, '2', 'Carro A deve vir primeiro')
  assert.strictEqual(sorted[1].id, '1', 'Carro B deve vir em segundo')
  assert.strictEqual(sorted[2].id, '3', 'Carro C deve vir em terceiro')
  assert.strictEqual(sorted[3].id, '4', 'Carro D sem data deve vir por último')
})

test('Ordenação "oldest" deve colocar o mais antigo primeiro', () => {
  const sorted = [...mockVehicles].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return timeA - timeB
  })
  // Carro D sem data (time 0) fica primeiro
  assert.strictEqual(sorted[0].id, '4', 'Carro D sem data tem menor timestamp')
  assert.strictEqual(sorted[1].id, '3', 'Carro C (30 dias) deve vir antes do de 3 dias')
  assert.strictEqual(sorted[sorted.length - 1].id, '2', 'Carro A (hoje) deve ser o último')
})

console.log(`\nResultado dos testes: ${passed} passaram, ${failed} falharam.`)
if (failed > 0) process.exit(1)
console.log('✅ Todos os testes do Prompt 4 passaram com 100% de sucesso!')
