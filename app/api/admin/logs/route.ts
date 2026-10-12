import { NextRequest, NextResponse } from 'next/server'
import { listAuditLogs } from '@/lib/supabase/erp-db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') || undefined
    const q = searchParams.get('q') || undefined

    const result = await listAuditLogs({ tipo, q })
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('Error in GET /api/admin/logs:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar logs' }, { status: 500 })
  }
}
