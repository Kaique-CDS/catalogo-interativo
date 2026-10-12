import { SignJWT, jwtVerify } from 'jose'

export const SUPER_ADMIN_COOKIE = 'super_admin_token'

function getSecretKey(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASS ||
    'vendazap-super-admin-secret-key-2026'
  return new TextEncoder().encode(secret)
}

export async function signSuperAdminToken(username: string): Promise<string> {
  return await new SignJWT({ sub: username, role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey())
}

export async function verifySuperAdminToken(token?: string | null): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, getSecretKey())
    return true
  } catch {
    return false
  }
}
