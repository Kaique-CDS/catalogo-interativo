import { NextRequest, NextResponse } from 'next/server'
import { cleanupResolvedTicketAttachments } from '@/lib/tickets-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Rota de Cron Job (ex: Vercel Cron diário às 03:00).
 * Protegida por segredo (CRON_SECRET) no header Authorization ou na query param ?secret=...
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const { searchParams } = new URL(req.url)
    const querySecret = searchParams.get('secret')

    const cronSecret = process.env.CRON_SECRET || 'vendazap_cron_secret_safe'
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      process.env.NODE_ENV === 'development'

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado. Forneça o CRON_SECRET no cabeçalho Authorization ou query param.' },
        { status: 401 }
      )
    }

    const result = await cleanupResolvedTicketAttachments()

    return NextResponse.json(
      {
        success: true,
        message: 'Rotina de limpeza de anexos de tickets executada com sucesso.',
        ...result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[CRON CLEANUP TICKETS]', err)
    return NextResponse.json({ error: err.message || 'Erro ao executar limpeza de tickets' }, { status: 500 })
  }
}
