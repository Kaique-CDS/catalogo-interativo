import { NextRequest } from 'next/server'
import { SUPER_ADMIN_COOKIE, verifySuperAdminToken } from '@/lib/admin-auth'
import { verifyLojistaSession } from '@/lib/auth-lojista'

export interface RequestAuth {
  isAuthenticated: boolean
  isSuperAdmin: boolean
  tenantId?: string
  userId?: string
}

/**
 * Valida a autenticação do chamador a partir dos cookies da requisição.
 */
export async function validateRequestAuth(req: NextRequest): Promise<RequestAuth> {
  // 1. Checa Super Admin
  const superAdminToken = req.cookies.get(SUPER_ADMIN_COOKIE)?.value
  if (superAdminToken) {
    const isValid = await verifySuperAdminToken(superAdminToken)
    if (isValid) {
      return {
        isAuthenticated: true,
        isSuperAdmin: true,
      }
    }
  }

  // 2. Checa sessão assinada de lojista
  const sessionToken = req.cookies.get('lojista_session')?.value
  if (sessionToken) {
    const verified = await verifyLojistaSession(sessionToken)
    if (verified) {
      return {
        isAuthenticated: true,
        isSuperAdmin: false,
        tenantId: verified.tenantId,
        userId: verified.userId,
      }
    }
  }

  // 3. Fallback de compatibilidade com cookies por tenant (admin_auth_{slug})
  const allCookies = req.cookies.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('admin_auth_') && cookie.value === 'true') {
      const slug = cookie.name.replace('admin_auth_', '').trim().toLowerCase()
      if (slug) {
        return {
          isAuthenticated: true,
          isSuperAdmin: false,
          tenantId: slug,
        }
      }
    }
    if (cookie.name === 'admin_auth' && cookie.value === 'true') {
      return {
        isAuthenticated: true,
        isSuperAdmin: false,
        tenantId: 'milhaticar',
      }
    }
  }

  return {
    isAuthenticated: false,
    isSuperAdmin: false,
  }
}

/**
 * Verifica se a sessão atual tem autorização para ler ou modificar dados da loja especificada.
 * Super Admin tem permissão global; Lojistas apenas na sua respectiva empresa.
 */
export function canAccessTenant(auth: RequestAuth, targetTenant: string): boolean {
  if (!auth.isAuthenticated) return false
  if (auth.isSuperAdmin) return true
  if (!targetTenant) return false

  const cleanTarget = targetTenant.trim().toLowerCase()
  const cleanAuth = auth.tenantId?.trim().toLowerCase()

  // Milhaticar e loja-exemplo compartilham contexto de teste
  if (
    (cleanAuth === 'milhaticar' || cleanAuth === 'loja-exemplo') &&
    (cleanTarget === 'milhaticar' || cleanTarget === 'loja-exemplo')
  ) {
    return true
  }

  return cleanAuth === cleanTarget
}

/**
 * Mascara documentos sensíveis (CPF, RG, CNH) para exibição segura em listagens públicas/semi-públicas.
 */
export function maskDocument(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    // CPF: 123.***.***-00
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`
  }
  if (digits.length === 14) {
    // CNPJ: 12.***.***/0001-00
    return `${digits.slice(0, 2)}.***.***/${digits.slice(8, 12)}-${digits.slice(12)}`
  }
  if (raw.length > 5) {
    return `${raw.slice(0, 2)}****${raw.slice(-2)}`
  }
  return '***'
}
