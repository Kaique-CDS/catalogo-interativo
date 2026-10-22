import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateLojista,
  setLojistaSessionCookie,
} from '@/lib/auth-lojista'
import { SUPER_ADMIN_COOKIE, signSuperAdminToken } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/supabase/erp-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'E-mail/usuário e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    const result = await authenticateLojista(String(identifier), String(password))

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Credenciais inválidas.' },
        { status: 401 }
      )
    }

    // Se for o Super Admin da plataforma, autentica e direciona para /admin
    if (result.isSuperAdmin) {
      const username = result.user?.email || 'super_admin'
      const token = await signSuperAdminToken(username)
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1'

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

    // Se possui exatamente 1 loja, já ativa o cookie e retorna a URL de destino
    if (result.stores && result.stores.length === 1) {
      await setLojistaSessionCookie(result.stores[0].tenant_id)
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
      { error: err?.message || 'Erro interno ao realizar login.' },
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
