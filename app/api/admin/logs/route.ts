import { NextRequest, NextResponse } from 'next/server'
import { listAuditLogs } from '@/lib/supabase/erp-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') || undefined
    const q = searchParams.get('q') || undefined

    const result = await listAuditLogs({ tipo, q })
    return NextResponse.json(
      {
        logs: result.logs,
        counts: result.counts,
        stats: {
          total: result.counts.total,
          logins: result.counts.login,
          erros: result.counts.erro,
          criticos: result.counts.critico,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/logs:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar logs' }, { status: 500 })
  }
}
