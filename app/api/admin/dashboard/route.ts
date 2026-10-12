import { NextResponse } from 'next/server'
import { listClientes, syncAndListFaturas, listAuditLogs } from '@/lib/supabase/erp-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function GET() {
  try {
    const [clientes, faturas, audit] = await Promise.all([
      listClientes(),
      syncAndListFaturas(),
      listAuditLogs({ limit: 5 }),
    ])

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11

    const activeClientIds = new Set(
      clientes.filter((c) => c.status === 'ativo').map((c) => c.id)
    )

    // MRR: soma de faturas.valor onde status = 'pago' e cliente ativo no mês atual
    const mrr = faturas
      .filter((f) => {
        if (f.status !== 'pago') return false
        const isClientActive = f.clientes?.status === 'ativo' || activeClientIds.has(f.cliente_id)
        if (!isClientActive) return false
        const d = new Date(f.vencimento + 'T12:00:00')
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      })
      .reduce((acc, f) => acc + Number(f.valor || 0), 0)

    const lojasAtivas = clientes.filter((c) => c.status === 'ativo').length
    const faturasVencidas = faturas.filter((f) => f.status === 'atrasado').length

    const totalClientes = clientes.length
    const clientesInativos = clientes.filter((c) => c.status === 'inativo').length
    const churnRate =
      totalClientes > 0
        ? Number(((clientesInativos / totalClientes) * 100).toFixed(1))
        : 0

    // Gráfico dos últimos 6 meses agrupando faturas por mês (vencimento)
    const chartData: { month: string; key: string; pagos: number; trials: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      chartData.push({
        month: `${MONTH_NAMES[m]}/${String(y).slice(-2)}`,
        key,
        pagos: 0,
        trials: 0,
      })
    }

    faturas.forEach((f) => {
      if (!f.vencimento) return
      const key = f.vencimento.slice(0, 7) // YYYY-MM
      const bucket = chartData.find((b) => b.key === key)
      if (bucket) {
        if (f.status === 'pago') bucket.pagos += 1
        if (f.status === 'trial') bucket.trials += 1
      }
    })

    return NextResponse.json(
      {
        mrr,
        lojasAtivas,
        faturasVencidas,
        churnRate,
        chartData,
        chartMonths: chartData,
        recentLogs: audit.logs,
        clientes,
        faturas,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/dashboard:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
