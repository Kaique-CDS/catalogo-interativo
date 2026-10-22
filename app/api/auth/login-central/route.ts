import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateLojista,
  setLojistaSessionCookie,
} from '@/lib/auth-lojista'

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
