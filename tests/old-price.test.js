const assert = require('assert')
const { parsePrecoBR, formatPrecoBR } = require('./normalization.cjs')

console.log('=== TESTES DE PREÇO CORTADO DE / POR (PROMPT 7) ===\n')

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

// 1. Validações de Regra de Negócio (old_price > price)
console.log('[1. Regras de Validação De/Por]')

function validateDePor(currentPriceInput, oldPriceInput) {
  const currentPrice = parsePrecoBR(currentPriceInput)
  if (!currentPrice || currentPrice <= 0) {
    return { valid: false, error: 'Preço atual inválido' }
  }

  if (oldPriceInput === undefined || oldPriceInput === null || String(oldPriceInput).trim() === '') {
    return { valid: true, price: currentPrice, old_price: null }
  }

  const oldPrice = parsePrecoBR(oldPriceInput)
  if (!oldPrice || oldPrice <= 0) {
    return { valid: false, error: 'Preço anterior inválido' }
  }

  if (oldPrice <= currentPrice) {
    return { valid: false, error: 'O preço anterior deve ser maior que o preço atual' }
  }

  return { valid: true, price: currentPrice, old_price: oldPrice }
}

test('Preço anterior maior que o atual é aprovado com sucesso', () => {
  const res = validateDePor('139.900', '147.900')
  assert.strictEqual(res.valid, true)
  assert.strictEqual(res.price, 139900)
  assert.strictEqual(res.old_price, 147900)
})

test('Preço anterior com prefixo R$ e centavos maior que o atual é aprovado', () => {
  const res = validateDePor('R$ 42.900,00', 'R$ 45.900,00')
  assert.strictEqual(res.valid, true)
  assert.strictEqual(res.price, 42900)
  assert.strictEqual(res.old_price, 45900)
})

test('Preço anterior em branco é opcional e salva old_price como null', () => {
  const resEmpty = validateDePor('139.900', '')
  assert.strictEqual(resEmpty.valid, true)
  assert.strictEqual(resEmpty.price, 139900)
  assert.strictEqual(resEmpty.old_price, null)

  const resNull = validateDePor('139.900', null)
  assert.strictEqual(resNull.valid, true)
  assert.strictEqual(resNull.old_price, null)
})

test('Preço anterior IGUAL ao preço atual é estritamente rejeitado', () => {
  const res = validateDePor('139.900', '139.900')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'O preço anterior deve ser maior que o preço atual')
})

test('Preço anterior MENOR que o preço atual é estritamente rejeitado', () => {
  const res = validateDePor('139.900', '129.900')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'O preço anterior deve ser maior que o preço atual')
})

test('Preço anterior com formato inválido (letras) é rejeitado', () => {
  const res = validateDePor('139.900', 'cem mil')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'Preço anterior inválido')
})

test('Formatação visual de ambos os preços opera com precisão pt-BR', () => {
  const res = validateDePor('139.900,50', '149.900,50')
  assert.strictEqual(res.valid, true)
  assert.strictEqual(formatPrecoBR(res.price), 'R$ 139.900,50')
  assert.strictEqual(formatPrecoBR(res.old_price), 'R$ 149.900,50')
})

console.log(`\nResultado dos testes: ${passed} passaram, ${failed} falharam.`)
if (failed > 0) process.exit(1)
console.log('✅ Todos os testes do Prompt 7 passaram com 100% de sucesso!')
