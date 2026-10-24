import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateLojista,
  setLojistaSessionCookie,
} from '@/lib/auth-lojista'
import { SUPER_ADMIN_COOKIE, signSuperAdminToken } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/supabase/erp-db'
import {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/security/rate-limit'
import { verifyTotpToken } from '@/lib/security/totp'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateLimitKey = `login_${ip}`

    // 1. Checagem de Rate Limit / Bloqueio Temporário por IP
    const rateCheck = checkRateLimit(rateLimitKey, 15, 60)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas de login. Aguarde ${rateCheck.retryAfter || 60} segundos antes de tentar novamente.`,
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { identifier, password, totpCode } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'E-mail/usuário e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    const result = await authenticateLojista(String(identifier), String(password))

    if (!result.success) {
      const failStatus = recordFailedAttempt(rateLimitKey, 5, 15 * 60)
      if (failStatus.locked) {
        return NextResponse.json(
          {
            error:
              'Conta temporariamente bloqueada por excesso de tentativas incorretas. Tente novamente em 15 minutos.',
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error:
            result.error ||
            `Credenciais inválidas. Restam ${failStatus.remainingAttempts} tentativas antes do bloqueio temporário.`,
        },
        { status: 401 }
      )
    }

    // Se for o Super Admin da plataforma
    if (result.isSuperAdmin) {
      // Checa se o Super Admin possui MFA (TOTP) configurado
      const superAdminMfaSecret = process.env.MFA_SUPER_ADMIN_SECRET?.trim()
      if (superAdminMfaSecret) {
        if (!totpCode) {
          return NextResponse.json(
            {
              requiresMfa: true,
              message: 'Código de autenticação em duas etapas (2FA) obrigatório.',
            },
            { status: 200 }
          )
        }

        const isTotpValid = verifyTotpToken(String(totpCode), superAdminMfaSecret)
        if (!isTotpValid) {
          recordFailedAttempt(rateLimitKey, 5, 15 * 60)
          return NextResponse.json(
            { error: 'Código de autenticação (MFA/TOTP) incorreto ou expirado.' },
            { status: 401 }
          )
        }
      }

      clearFailedAttempts(rateLimitKey)
      const username = result.user?.email || 'super_admin'
      const token = await signSuperAdminToken(username)

      try {
        await insertAuditLog({
          tipo: 'login',
          criticidade: 'normal',
          descricao: 'Super Admin fez login pelo acesso central (/entrar)',
          ator: username,
          ip,
        })
      } catch {}

      const res = NextResponse.json(
        {
          success: true,
          redirectTo: '/admin',
          isSuperAdmin: true,
        },
        { status: 200 }
      )

      res.cookies.set(SUPER_ADMIN_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 horas
        secure: process.env.NODE_ENV === 'production',
      })

      return res
    }

    // Sucesso para lojista: limpa contadores de falhas
    clearFailedAttempts(rateLimitKey)

    // Se possui exatamente 1 loja, já ativa o cookie e retorna a URL de destino
    if (result.stores && result.stores.length === 1) {
      await setLojistaSessionCookie(result.stores[0].tenant_id, result.user?.id)
      return NextResponse.json(
        {
          success: true,
          redirectTo: result.redirectTo || `/${result.stores[0].tenant_id}/admin`,
          store: result.stores[0],
        },
        { status: 200 }
      )
    }

    // Se possui múltiplas lojas vinculadas, retorna a lista para seleção pelo usuário
    return NextResponse.json(
      {
        success: true,
        user: result.user,
        stores: result.stores,
        requiresChoice: true,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[API LOGIN CENTRAL POST]', err)
    return NextResponse.json(
      { error: 'Erro interno ao realizar autenticação.' },
      { status: 500 }
    )
  }
}

// Endpoint para quando o usuário seleciona uma loja específica dentre múltiplas
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório.' }, { status: 400 })
    }

    await setLojistaSessionCookie(tenant_id)

    return NextResponse.json(
      {
        success: true,
        redirectTo: `/${tenant_id}/admin`,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[API LOGIN CENTRAL PUT]', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao definir loja selecionada.' },
      { status: 500 }
    )
  }
}
