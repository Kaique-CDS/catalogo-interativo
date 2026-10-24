import crypto from 'crypto'

/**
 * Módulo de Criptografia em Nível de Campo (Field-Level Encryption)
 * Utiliza AES-256-GCM com IV único e tag de autenticação para proteger
 * dados ultrassensíveis (CPF, RG, CNH) em repouso.
 */

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer | null {
  const rawKey = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET
  if (!rawKey) return null
  // Deriva chave de 32 bytes usando SHA-256
  return crypto.createHash('sha256').update(rawKey).digest()
}

/**
 * Criptografa uma string sensível. Retorna string no formato iv:ciphertext:authTag
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText
  const key = getEncryptionKey()
  if (!key) return plainText // Se não configurada, preserva original

  try {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(plainText, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    const authTag = cipher.getAuthTag().toString('base64')

    return `enc:${iv.toString('base64')}:${encrypted}:${authTag}`
  } catch (err) {
    console.error('[FIELD_ENCRYPTION_ERROR]', err)
    return plainText
  }
}

/**
 * Decriptografa uma string protegida no formato enc:iv:ciphertext:authTag
 */
export function decryptField(cipherText: string): string {
  if (!cipherText || !cipherText.startsWith('enc:')) return cipherText
  const key = getEncryptionKey()
  if (!key) return cipherText

  try {
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
  } catch (err) {
    console.error('[FIELD_DECRYPTION_ERROR]', err)
    return cipherText
  }
}
