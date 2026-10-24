/**
 * Módulo de Prevenção contra SSRF (Server-Side Request Forgery)
 * Impede que requisições originadas do servidor alcancem redes internas,
 * metadados de nuvem (169.254.169.254) ou serviços em localhost.
 */

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS/GCP/Azure instance metadata
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
]

export function isSafeExternalUrl(urlStr: string): { safe: boolean; error?: string } {
  if (!urlStr || typeof urlStr !== 'string') {
    return { safe: false, error: 'URL vazia ou inválida.' }
  }

  let parsed: URL
  try {
    parsed = new URL(urlStr)
  } catch {
    return { safe: false, error: 'Formato de URL inválido.' }
  }

  if (parsed.protocol !== 'https:') {
    return { safe: false, error: 'Apenas conexões HTTPS seguras são permitidas.' }
  }

  const hostname = parsed.hostname.toLowerCase()

  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        safe: false,
        error: 'Acesso a endereços locais ou de rede privada bloqueado por segurança.',
      }
    }
  }

  return { safe: true }
}

/**
 * Fetch seguro com validação prévia de SSRF
 */
export async function safeFetch(urlStr: string, init?: RequestInit): Promise<Response> {
  const check = isSafeExternalUrl(urlStr)
  if (!check.safe) {
    throw new Error(`[SSRF_BLOCKED] ${check.error}`)
  }
  return fetch(urlStr, init)
}
