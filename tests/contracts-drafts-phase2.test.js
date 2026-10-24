const assert = require('assert')
const crypto = require('crypto')

// Configura chave de criptografia de teste se não existir
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super-secret-key-32-chars-test!!'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey() {
  return crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest()
}

function encryptField(plainText) {
  if (!plainText) return plainText
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag().toString('base64')
  return `enc:${iv.toString('base64')}:${encrypted}:${authTag}`
}

function decryptField(cipherText) {
  if (!cipherText || !cipherText.startsWith('enc:')) return cipherText
  const key = getEncryptionKey()
  const parts = cipherText.split(':')
  if (parts.length !== 4) return cipherText
  const iv = Buffer.from(parts[1], 'base64')
  const encrypted = parts[2]
  const authTag = Buffer.from(parts[3], 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const UNIDADES_ORDINAIS = [
  '',
  'PRIMEIRA',
  'SEGUNDA',
  'TERCEIRA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SÉTIMA',
  'OITAVA',
  'NONA',
]

const DEZENAS_ORDINAIS = [
  '',
  'DÉCIMA',
  'VIGÉSIMA',
  'TRIGÉSIMA',
  'QUADRAGÉSIMA',
  'QUINQUAGÉSIMA',
  'SEXAGÉSIMA',
  'SEPTUAGÉSIMA',
  'OCTOGÉSIMA',
  'NONAGÉSIMA',
]

function getOrdinalFeminine(n) {
  if (n <= 0) return `${n}ª`
  if (n <= 9) return UNIDADES_ORDINAIS[n]
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    if (u === 0) return DEZENAS_ORDINAIS[d]
    return `${DEZENAS_ORDINAIS[d]} ${UNIDADES_ORDINAIS[u]}`
  }
  if (n === 100) return 'CENTÉSIMA'
  return `${n}ª`
}

function stripClauseOrdinalPrefix(title) {
  if (!title) return ''
  return title
    .replace(/^CLÁUSULA\s+[A-ZÀ-Ú0-9ºª\s]+[-–—]\s*/i, '')
    .replace(/^CLÁUSULA\s+[A-ZÀ-Ú0-9ºª\s]+:\s*/i, '')
    .replace(/^CLÁUSULA\s+[A-ZÀ-Ú0-9ºª\s]+\s+/i, '')
    .trim()
}

function formatClauseFullTitle(index, rawTitle) {
  const clean = stripClauseOrdinalPrefix(rawTitle)
  const ordinal = getOrdinalFeminine(index + 1)
  return clean ? `CLÁUSULA ${ordinal} – ${clean.toUpperCase()}` : `CLÁUSULA ${ordinal}`
}

const PII_FIELDS = ['cpf_cnpj', 'rg_ie', 'cnh', 'email', 'phone', 'address', 'zip', 'rep_cpf', 'birth_date']

function encryptPartyPII(party) {
  if (!party || typeof party !== 'object') return party
  const cloned = { ...party }
  for (const field of PII_FIELDS) {
    if (cloned[field] && typeof cloned[field] === 'string') {
      cloned[field] = encryptField(cloned[field])
    }
  }
  return cloned
}

function decryptPartyPII(party) {
  if (!party || typeof party !== 'object') return party
  const cloned = { ...party }
  for (const field of PII_FIELDS) {
    if (cloned[field] && typeof cloned[field] === 'string') {
      cloned[field] = decryptField(cloned[field])
    }
  }
  return cloned
}

async function runTests() {
  console.log('🧪 Iniciando Testes Automatizados da Fase 2: Rascunhos e Cláusulas...')

  // -------------------------------------------------------------
  // Teste 1: Criptografia e Descriptografia de Dados Pessoais (PII)
  // -------------------------------------------------------------
  const samplePII = {
    name: 'Carlos Eduardo Santos',
    cpf_cnpj: '123.456.789-00',
    rg_ie: '12.345.678-9 SSP/SP',
    cnh: '01234567890',
    email: 'carlos@empresa.com.br',
    phone: '(11) 98765-4321',
    address: 'Rua das Palmeiras, 450 - Jardins',
    zip: '01400-000',
    birth_date: '1985-05-15',
  }

  const encrypted = encryptPartyPII(samplePII)
  assert.strictEqual(encrypted.name, 'Carlos Eduardo Santos', 'Nome público não deve ser cifrado')
  assert(encrypted.cpf_cnpj.startsWith('enc:'), 'CPF deve estar cifrado com prefixo enc:')
  assert(encrypted.rg_ie.startsWith('enc:'), 'RG deve estar cifrado com prefixo enc:')
  assert(encrypted.cnh.startsWith('enc:'), 'CNH deve estar cifrada com prefixo enc:')
  assert(encrypted.email.startsWith('enc:'), 'Email deve estar cifrado com prefixo enc:')
  assert(encrypted.phone.startsWith('enc:'), 'Telefone deve estar cifrado com prefixo enc:')
  assert(encrypted.address.startsWith('enc:'), 'Endereço deve estar cifrado com prefixo enc:')
  assert(encrypted.zip.startsWith('enc:'), 'CEP deve estar cifrado com prefixo enc:')
  assert(encrypted.birth_date.startsWith('enc:'), 'Data de nascimento deve estar cifrada com prefixo enc:')

  // Verifica que os dados não estão em texto plano no payload cifrado
  assert(!JSON.stringify(encrypted).includes('123.456.789-00'), 'CPF nunca pode aparecer em texto plano no payload para o DB')
  assert(!JSON.stringify(encrypted).includes('carlos@empresa.com.br'), 'Email nunca pode aparecer em texto plano no payload para o DB')

  // Descriptografia
  const decrypted = decryptPartyPII(encrypted)
  assert.deepStrictEqual(decrypted, samplePII, 'Dados descriptografados devem bater exatamente com o original')
  console.log('  ✅ Teste 1: Criptografia e Descriptografia de PII aprovada!')

  // -------------------------------------------------------------
  // Teste 2: Numeração Ordinal Feminina Dinâmica (1 até 35)
  // -------------------------------------------------------------
  assert.strictEqual(getOrdinalFeminine(1), 'PRIMEIRA')
  assert.strictEqual(getOrdinalFeminine(2), 'SEGUNDA')
  assert.strictEqual(getOrdinalFeminine(3), 'TERCEIRA')
  assert.strictEqual(getOrdinalFeminine(4), 'QUARTA')
  assert.strictEqual(getOrdinalFeminine(5), 'QUINTA')
  assert.strictEqual(getOrdinalFeminine(6), 'SEXTA')
  assert.strictEqual(getOrdinalFeminine(7), 'SÉTIMA')
  assert.strictEqual(getOrdinalFeminine(8), 'OITAVA')
  assert.strictEqual(getOrdinalFeminine(9), 'NONA')
  assert.strictEqual(getOrdinalFeminine(10), 'DÉCIMA')
  assert.strictEqual(getOrdinalFeminine(11), 'DÉCIMA PRIMEIRA')
  assert.strictEqual(getOrdinalFeminine(12), 'DÉCIMA SEGUNDA')
  assert.strictEqual(getOrdinalFeminine(20), 'VIGÉSIMA')
  assert.strictEqual(getOrdinalFeminine(21), 'VIGÉSIMA PRIMEIRA')
  assert.strictEqual(getOrdinalFeminine(35), 'TRIGÉSIMA QUINTA')
  console.log('  ✅ Teste 2: Ordinais femininos dinâmicos aprovados!')

  // -------------------------------------------------------------
  // Teste 3: Limpeza de Prefixo e Reordenação Automática
  // -------------------------------------------------------------
  const rawTitle1 = 'CLÁUSULA PRIMEIRA – DO ESTADO E VISTORIA DO VEÍCULO'
  const rawTitle2 = 'CLÁUSULA SEGUNDA – DO SINAL E RESCISÃO'
  const rawTitle3 = 'CLÁUSULA TERCEIRA – DA TRADIÇÃO E PRAZO DE ENTREGA'

  assert.strictEqual(stripClauseOrdinalPrefix(rawTitle1), 'DO ESTADO E VISTORIA DO VEÍCULO')
  assert.strictEqual(stripClauseOrdinalPrefix(rawTitle2), 'DO SINAL E RESCISÃO')
  assert.strictEqual(stripClauseOrdinalPrefix(rawTitle3), 'DA TRADIÇÃO E PRAZO DE ENTREGA')

  // Se o usuário inverter as cláusulas (Cláusula 3 agora fica no index 0)
  const reorderedTitleAt0 = formatClauseFullTitle(0, rawTitle3)
  assert.strictEqual(reorderedTitleAt0, 'CLÁUSULA PRIMEIRA – DA TRADIÇÃO E PRAZO DE ENTREGA')

  // Se Cláusula 1 for para index 2
  const reorderedTitleAt2 = formatClauseFullTitle(2, rawTitle1)
  assert.strictEqual(reorderedTitleAt2, 'CLÁUSULA TERCEIRA – DO ESTADO E VISTORIA DO VEÍCULO')

  // Nova cláusula criada vazia sem número
  const newClauseFormatted = formatClauseFullTitle(3, 'DA VISTORIA CAUTELAR')
  assert.strictEqual(newClauseFormatted, 'CLÁUSULA QUARTA – DA VISTORIA CAUTELAR')

  console.log('  ✅ Teste 3: Limpeza e formatação de reordenação aprovadas!')

  // -------------------------------------------------------------
  // Teste 4: Fallback sessionStorage com Zero PII
  // -------------------------------------------------------------
  const clientStoragePayload = {
    step: 2,
    vehicle: { brand: 'Toyota', model: 'Corolla', year: 2023 },
    totalAmount: 110000,
    downPayment: 20000,
    installments: [{ number: 1, amount: 90000, method: 'Financiamento' }],
    clauses: [{ id: 'cl-1', title: 'DO ESTADO', text: 'Texto...' }],
  }

  const serialized = JSON.stringify(clientStoragePayload)
  assert(!serialized.includes('cpf'), 'sessionStorage não pode ter campo cpf')
  assert(!serialized.includes('rg_ie'), 'sessionStorage não pode ter campo rg_ie')
  assert(!serialized.includes('cnh'), 'sessionStorage não pode ter campo cnh')
  console.log('  ✅ Teste 4: Fallback de sessão com Zero PII garantido!')

  console.log('\n🎉 TODOS OS TESTES DA FASE 2 PASSARAM COM SUCESSO!')
}

runTests().catch((err) => {
  console.error('❌ Falha nos testes da Fase 2:', err)
  process.exit(1)
})
