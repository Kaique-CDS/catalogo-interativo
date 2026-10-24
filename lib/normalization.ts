/**
 * Módulo de Normalização e Sanitização Centralizada (Catálogo Interativo)
 * Regras obrigatórias de integridade de dados (Fase 0.2):
 * - CPF, CNPJ, telefone, CEP e Renavam gravados apenas com dígitos
 * - Placas em letras maiúsculas
 * - E-mails em minúsculas e sem espaços
 * - Dinheiro tratado com precisão de centavos (nunca truncado por parseFloat ingênuo)
 * - Datas no fuso America/Sao_Paulo (sem virar o dia por UTC)
 * - Texto preservando acentos UTF-8 e sanitizado contra XSS
 */

/**
 * Remove qualquer caractere que não seja dígito numérico (0-9).
 * Ideal para CPF, CNPJ, telefones, CEP e Renavam.
 */
export function normalizeDigits(val?: string | number | null): string {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\D/g, '').trim()
}

/**
 * Normaliza placa veicular para formato maiúsculo sem hífens ou espaços.
 * Suporta padrão tradicional (ABC1234) e Mercosul (ABC1D23).
 */
export function normalizePlate(val?: string | null): string {
  if (!val) return ''
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

/**
 * Normaliza e-mail para minúsculas e sem espaços laterais.
 */
export function normalizeEmail(val?: string | null): string {
  if (!val) return ''
  return val.trim().toLowerCase()
}

/**
 * Normaliza texto livre preservando caracteres UTF-8 (acentos, cedilhas, aspas)
 * e sanitiza tags HTML perigosas para evitar XSS.
 */
export function normalizeText(val?: string | null): string {
  if (!val) return ''
  const trimmed = val.trim()
  // Sanitiza scripts e tags perigosas
  return trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
}

import { parsePrecoBR, formatPrecoBR, isValidPrecoBR } from './pricing'
export { parsePrecoBR, formatPrecoBR, isValidPrecoBR }

/**
 * Converte qualquer representação monetária brasileira (pt-BR) ou numérica para número float seguro
 * com precisão em centavos (2 casas decimais).
 * 
 * Ex:
 *  "139.900,00" => 139900
 *  "139900,00"  => 139900
 *  "139.900"    => 139900
 *  "139900"     => 139900
 *  "R$ 1.250,50" => 1250.5
 *  139900       => 139900
 */
export function parseBrlCurrency(value?: string | number | null): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.round(value * 100) / 100
  }

  const parsed = parsePrecoBR(value)
  if (parsed !== null) return parsed

  // Fallback para caso seja 0 legítimo
  const clean = String(value).trim().replace(/^R\$\s*/i, '').replace(/\s+/g, '')
  if (clean === '0' || clean === '0,00' || clean === '0.00') return 0

  return 0
}

/**
 * Converte valor em reais para centavos inteiros (para armazenamento seguro sem ponto flutuante).
 */
export function currencyToCents(value?: string | number | null): number {
  const num = parseBrlCurrency(value)
  return Math.round(num * 100)
}

/**
 * Converte centavos inteiros para valor em reais.
 */
export function centsToCurrency(cents: number): number {
  return Math.round(cents) / 100
}

/**
 * Normaliza e formata data no fuso de São Paulo (America/Sao_Paulo),
 * evitando o deslocamento para o dia anterior causado pelo UTC.
 * Retorna no formato YYYY-MM-DD.
 */
export function normalizeDateToSaoPaulo(val?: string | Date | null): string | null {
  if (!val) return null

  try {
    // Se já estiver no formato YYYY-MM-DD, preserva diretamente
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      return val.trim()
    }

    // Se estiver no formato brasileiro DD/MM/AAAA
    if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val.trim())) {
      const [d, m, y] = val.trim().split('/')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    const date = typeof val === 'string' ? new Date(val) : val
    if (isNaN(date.getTime())) return null

    // Converte para dia/mês/ano no fuso horário oficial de Brasília
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(date) // Retorna YYYY-MM-DD
  } catch {
    return null
  }
}

/**
 * Formata data ISO/YYYY-MM-DD para exibição amigável brasileira (DD/MM/AAAA).
 */
export function formatDateBr(val?: string | Date | null): string {
  const ymd = normalizeDateToSaoPaulo(val)
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}
