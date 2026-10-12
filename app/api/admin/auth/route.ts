import { NextRequest, NextResponse } from 'next/server'
import { SUPER_ADMIN_COOKIE, signSuperAdminToken } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/supabase/erp-db'

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = String(body.username || '').trim().toLowerCase()
    const password = String(body.password || '').trim()

    const validUser = (process.env.ADMIN_USER || 'gabriel').trim().toLowerCase()
    const validPass = (process.env.ADMIN_PASS || 'kaique').trim()
    const ip = getRequestIp(req)

    if (username !== validUser || password !== validPass) {
      return NextResponse.json(
        { error: 'Usuário ou senha incorretos.' },
        { status: 401 }
      )
    }

    const token = await signSuperAdminToken(username)

    // Registra log real de login na tabela logs_auditoria
    try {
      await insertAuditLog({
        tipo: 'login',
        criticidade: 'normal',
        descricao: 'Super Admin fez login no painel',
        ator: username,
        ip,
      })
    } catch (logErr) {
      console.error('Erro ao registrar log de login:', logErr)
    }

    const res = NextResponse.json({ success: true }, { status: 200 })
    res.cookies.set(SUPER_ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
      secure: process.env.NODE_ENV === 'production',
    })

    return res
  } catch (err: any) {
    console.error('Error in POST /api/admin/auth:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true }, { status: 200 })
  res.cookies.set(SUPER_ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
