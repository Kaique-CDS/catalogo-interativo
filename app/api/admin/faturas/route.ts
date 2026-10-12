import { NextRequest, NextResponse } from 'next/server'
import { syncAndListFaturas, updateFaturaStatus, type FaturaStatus } from '@/lib/supabase/erp-db'

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
    const status = searchParams.get('status') || undefined
    const q = searchParams.get('q') || undefined

    const faturas = await syncAndListFaturas({ status, q })
    return NextResponse.json(
      { faturas },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/faturas:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar faturas' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body
    if (!id || !status) {
      return NextResponse.json({ error: 'id e status são obrigatórios' }, { status: 400 })
    }
    const updated = await updateFaturaStatus(id, status as FaturaStatus, getRequestIp(req))
    return NextResponse.json({ fatura: updated }, { status: 200 })
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/faturas:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar fatura' }, { status: 500 })
  }
}
