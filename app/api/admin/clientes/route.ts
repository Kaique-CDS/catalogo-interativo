import { NextRequest, NextResponse } from 'next/server'
import { listClientes, createCliente, type PlanoTipo, type ClienteStatus } from '@/lib/supabase/erp-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined
    const plano = searchParams.get('plano') || undefined

    const clientes = await listClientes({ q, status, plano })
    return NextResponse.json(
      { clientes },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/clientes:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome_loja, email, cnpj, plano, status, uso_banco_mb, data_vencimento } = body

    if (!nome_loja || !email || !plano || !data_vencimento) {
      return NextResponse.json(
        { error: 'Nome da loja, e-mail, plano e data de vencimento são obrigatórios.' },
        { status: 400 }
      )
    }

    const created = await createCliente(
      {
        nome_loja: String(nome_loja).trim(),
        email: String(email).trim(),
        cnpj: cnpj ? String(cnpj).trim() : null,
        plano: plano as PlanoTipo,
        status: status as ClienteStatus | undefined,
        uso_banco_mb: Number(uso_banco_mb || 0),
        data_vencimento: String(data_vencimento),
      },
      getRequestIp(req)
    )

    return NextResponse.json({ cliente: created, ...created }, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/admin/clientes:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar cliente' }, { status: 500 })
  }
}
