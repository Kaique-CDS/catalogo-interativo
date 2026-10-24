import crypto from 'crypto'

/**
 * Módulo nativo de MFA (TOTP - RFC 6238)
 * Compatível com Google Authenticator, Microsoft Authenticator, Authy e 1Password.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanInput[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

/**
 * Gera um novo segredo TOTP em Base32 (160 bits / 20 bytes)
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20)
  return base32Encode(randomBytes)
}

/**
 * Calcula o código TOTP de 6 dígitos para um determinado counter
 */
function getHotpToken(keyBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))

  const hmac = crypto.createHmac('sha1', keyBuffer)
  hmac.update(counterBuffer)
  const digest = hmac.digest()

  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  const str = (code % 1000000).toString()
  return str.padStart(6, '0')
}

/**
 * Verifica se um código de 6 dígitos informado pelo usuário é válido
 * Suporta janela de skew de ±1 período (30s antes / 30s depois)
 */
export function verifyTotpToken(
  token: string,
  secretBase32: string,
  windowSteps: number = 1
): boolean {
  if (!token || typeof token !== 'string') return false
  const cleanToken = token.trim()
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false

  try {
    const key = base32Decode(secretBase32)
    const currentCounter = Math.floor(Date.now() / 1000 / 30)

    for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
      const expectedToken = getHotpToken(key, currentCounter + errorWindow)
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedToken))) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Cria a URI padrão otpauth:// para escanear em aplicativo autenticador
 */
export function buildTotpUri(params: {
  accountName: string
  issuer: string
  secret: string
}): string {
  const issuer = encodeURIComponent(params.issuer)
  const account = encodeURIComponent(params.accountName)
  return `otpauth://totp/${issuer}:${account}?secret=${params.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}
