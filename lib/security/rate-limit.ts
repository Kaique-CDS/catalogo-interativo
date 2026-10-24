/**
 * Módulo de Rate Limiting e Prevenção de Força Bruta
 * Implementa janela deslizante e bloqueio temporário em memória com limpeza periódica.
 */

interface RateRecord {
  timestamps: number[]
  lockedUntil?: number
  failureCount: number
}

const store = new Map<string, RateRecord>()

// Limpeza automática de registros inativos a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 3600 * 1000)
      if (
        record.timestamps.length === 0 &&
        (!record.lockedUntil || record.lockedUntil < now) &&
        record.failureCount === 0
      ) {
        store.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

function getRecord(key: string): RateRecord {
  let rec = store.get(key)
  if (!rec) {
    rec = { timestamps: [], failureCount: 0 }
    store.set(key, rec)
  }
  return rec
}

/**
 * Checa se uma chave (ex: IP ou rota) ultrapassou o limite de requisições.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = getRecord(key)

  // Verifica bloqueio temporário
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // Remove timestamps fora da janela
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs)

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) }
  }

  record.timestamps.push(now)
  const remaining = Math.max(0, maxRequests - record.timestamps.length)
  return { allowed: true, remaining }
}

/**
 * Registra falha de autenticação e aplica bloqueio temporário após exceder limite.
 */
export function recordFailedAttempt(
  key: string,
  maxFailures: number = 5,
  lockoutSeconds: number = 15 * 60
): { locked: boolean; remainingAttempts: number; retryAfter?: number } {
  const now = Date.now()
  const record = getRecord(key)

  record.failureCount += 1

  if (record.failureCount >= maxFailures) {
    record.lockedUntil = now + lockoutSeconds * 1000
    const retryAfter = lockoutSeconds
    return { locked: true, remainingAttempts: 0, retryAfter }
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, maxFailures - record.failureCount),
  }
}

/**
 * Reseta o contador de falhas em caso de sucesso.
 */
export function clearFailedAttempts(key: string): void {
  const record = store.get(key)
  if (record) {
    record.failureCount = 0
    record.lockedUntil = undefined
  }
}
