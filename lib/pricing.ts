/**
 * Módulo Centralizado de Parsing e Formatação de Preços Brasileiros (BRL)
 * Implementa tolerância a múltiplos formatos de entrada conforme Prompt 6:
 * - "42900"        => 42900
 * - "42.900"       => 42900 (ponto como milhar)
 * - "42.900,00"    => 42900
 * - "42900,50"     => 42900.50
 * - "42900.50"     => 42900.50 (ponto como decimal)
 * - "R$ 42.900,00" => 42900 (ignora símbolo e espaços)
 * - "1.234.567,89" => 1234567.89
 * 
 * Regra:
 * O último separador (vírgula ou ponto) seguido de 1 ou 2 dígitos é decimal;
 * qualquer outro ponto/vírgula é separador de milhar e é descartado.
 * Um ponto seguido de exatamente 3 dígitos é milhar.
 */

const MAX_PRECO_PERMITIDO = 999_999_999 // 999 milhões

/**
 * Converte string digitada ou colada em número float seguro (numeric).
 * Retorna null se a entrada contiver letras, for negativa, zerada ou malformada.
 */
export function parsePrecoBR(input?: string | number | null): number | null {
  if (input === undefined || input === null) return null

  // Se já for número
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0 || input > MAX_PRECO_PERMITIDO) return null
    return Math.round(input * 100) / 100
  }

  if (typeof input !== 'string') return null
  const raw = input.trim()
  if (!raw) return null

  // Remove prefixo R$ e espaços
  const clean = raw.replace(/^R\$\s*/i, '').replace(/\s+/g, '')
  if (!clean) return null

  // Rejeita letras, negativos ou caracteres não permitidos
  if (/[^0-9.,]/.test(clean)) return null

  // Rejeita múltiplos separadores decimais (ex: 12,34,56)
  if ((clean.match(/,/g) || []).length > 1) return null

  const lastDot = clean.lastIndexOf('.')
  const lastComma = clean.lastIndexOf(',')
  const lastSep = Math.max(lastDot, lastComma)

  // Caso 1: Sem separador (número inteiro puro, ex: "42900")
  if (lastSep === -1) {
    const num = Number(clean)
    if (isNaN(num) || num <= 0 || num > MAX_PRECO_PERMITIDO) return null
    return num
  }

  const charsAfter = clean.slice(lastSep + 1)
  const sepChar = clean[lastSep]

  // Caso 2: Ponto seguido de exatamente 3 dígitos (separador de milhar, ex: "42.900" ou "1.234.567")
  if (charsAfter.length === 3 && sepChar === '.') {
    const parts = clean.split('.')
    // Valida que todos os grupos após o primeiro possuem exatamente 3 dígitos
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length !== 3) return null
    }
    const num = Number(clean.replace(/\./g, ''))
    if (isNaN(num) || num <= 0 || num > MAX_PRECO_PERMITIDO) return null
    return num
  }

  // Caso 3: Último separador seguido de 1 ou 2 dígitos (separador decimal)
  if (charsAfter.length === 1 || charsAfter.length === 2) {
    const intPartRaw = clean.slice(0, lastSep)

    // Se a vírgula foi usada como decimal, os pontos no intPart devem ser milhares (grupos de 3)
    if (sepChar === ',') {
      const dotParts = intPartRaw.split('.')
      if (dotParts.length > 1) {
        for (let i = 1; i < dotParts.length; i++) {
          if (dotParts[i].length !== 3) return null
        }
      }
    } else {
      // Se o ponto foi usado como decimal (ex: "42900.50"), não pode haver outros pontos ou vírgulas
      if (intPartRaw.includes('.') || intPartRaw.includes(',')) return null
    }

    const intPart = intPartRaw.replace(/[.,]/g, '')
    if (!intPart) return null

    const num = Number(`${intPart}.${charsAfter}`)
    if (isNaN(num) || num <= 0 || num > MAX_PRECO_PERMITIDO) return null
    return Math.round(num * 100) / 100
  }

  // Qualquer outro formato com quantidade inconsistente de dígitos após o separador
  return null
}

/**
 * Formata um valor numérico para a representação padrão brasileira: "R$ 42.900,00"
 */
export function formatPrecoBR(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00A0/g, ' ') // Substitui non-breaking space do Intl por espaço padrão
}

/**
 * Validador booleano rápido para formulários
 */
export function isValidPrecoBR(input?: string | number | null): boolean {
  return parsePrecoBR(input) !== null
}
