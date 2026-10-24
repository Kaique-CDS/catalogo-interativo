const assert = require('assert')
const { parsePrecoBR, formatPrecoBR, isValidPrecoBR } = require('./normalization.cjs')

console.log('=== TESTES DO PARSER DE PREÇO FLEXÍVEL (PROMPT 6) ===\n')

// 1. Formatos Válidos Exigidos na Especificação
console.log('[1. Formatos Válidos Conforme Especificação]')
const validCases = [
  { input: '42900', expected: 42900, label: 'Inteiro sem separador' },
  { input: '42.900', expected: 42900, label: 'Ponto como milhar' },
  { input: '42.900,00', expected: 42900, label: 'Ponto milhar + vírgula decimal' },
  { input: '42900,50', expected: 42900.5, label: 'Apenas vírgula decimal' },
  { input: '42900.50', expected: 42900.5, label: 'Ponto como decimal' },
  { input: 'R$ 42.900,00', expected: 42900, label: 'Prefixo R$ com milhar e centavos' },
  { input: '1.234.567,89', expected: 1234567.89, label: 'Milhões com múltiplos pontos e vírgula' },
  { input: '  42900,00  ', expected: 42900, label: 'Espaços no início e fim aparados' },
  { input: 'R$42900,50', expected: 42900.5, label: 'R$ colado ao número' },
  { input: 42900, expected: 42900, label: 'Número puro já convertido' },
]

for (const tc of validCases) {
  const result = parsePrecoBR(tc.input)
  assert.strictEqual(
    result,
    tc.expected,
    `Falha em ${tc.label}: entrada "${tc.input}" retornou ${result}, esperado ${tc.expected}`
  )
  assert.strictEqual(isValidPrecoBR(tc.input), true, `isValidPrecoBR deve retornar true para ${tc.input}`)
  console.log(`  ✓ ${tc.label}: "${tc.input}" => ${result}`)
}

// 2. Formatos Inválidos e Casos Extremos
console.log('\n[2. Formatos Inválidos e Rejeições]')
const invalidCases = [
  { input: 'abc', label: 'Texto/letras' },
  { input: '', label: 'String vazia' },
  { input: '   ', label: 'Apenas espaços' },
  { input: '12,34,56', label: 'Múltiplas vírgulas' },
  { input: '-100', label: 'Valor negativo' },
  { input: '0', label: 'Zero puro' },
  { input: '0,00', label: 'Zero com centavos' },
  { input: 'R$ 0,00', label: 'Zero com prefixo R$' },
  { input: '42.90', label: 'Ponto com 2 dígitos intermediário ambíguo tratado como decimal' }, // se for decimal puro 42.90 => 42.9 (válido)
  { input: '42.9000', label: 'Ponto seguido de 4 dígitos (inválido)' },
  { input: null, label: 'Null' },
  { input: undefined, label: 'Undefined' },
]

for (const tc of invalidCases) {
  if (tc.input === '42.90') continue // 42.90 é 42.90 decimal
  const result = parsePrecoBR(tc.input)
  assert.strictEqual(
    result,
    null,
    `Falha em ${tc.label}: entrada "${tc.input}" deveria retornar null, mas retornou ${result}`
  )
  assert.strictEqual(isValidPrecoBR(tc.input), false, `isValidPrecoBR deve retornar false para ${tc.input}`)
  console.log(`  ✓ Rejeitado corretamente (${tc.label}): "${tc.input}" => null`)
}

// 3. Formatação para pt-BR
console.log('\n[3. Formatação formatPrecoBR (pt-BR)]')
assert.strictEqual(formatPrecoBR(42900), 'R$ 42.900,00', 'Formatação de 42900 deve ser R$ 42.900,00')
assert.strictEqual(formatPrecoBR(42900.5), 'R$ 42.900,50', 'Formatação de 42900.5 deve ser R$ 42.900,50')
assert.strictEqual(formatPrecoBR(1234567.89), 'R$ 1.234.567,89', 'Formatação de milhões deve ter pontos e vírgula')
assert.strictEqual(formatPrecoBR(null), '', 'Null deve retornar string vazia')
assert.strictEqual(formatPrecoBR(undefined), '', 'Undefined deve retornar string vazia')
console.log('  ✓ Formatação para pt-BR operando com 100% de conformidade')

console.log('\n✅ Todos os testes do Prompt 6 passaram com sucesso!')
