import { NextRequest, NextResponse } from 'next/server'
import { getConfiguracoes, saveConfiguracoes, listClientes, syncAndListFaturas, listAuditLogs, listMelhorias } from '@/lib/supabase/erp-db'
import { createAdminClient } from '@/lib/supabase/admin'

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET() {
  try {
    const config = await getConfiguracoes()

    // Calcula estatísticas reais do banco
    let totalRows = 0
    let totalStorageMb = 0
    try {
      const supabase = createAdminClient()
      const [clientes, faturas, logs, melhorias, { count: vehiclesCount }] = await Promise.all([
        listClientes(),
        syncAndListFaturas(),
        listAuditLogs(),
        listMelhorias(),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      ])
      totalRows =
        clientes.length +
        faturas.length +
        logs.counts.total +
        melhorias.length +
        (vehiclesCount || 0)
      totalStorageMb = clientes.reduce((acc, c) => acc + Number(c.uso_banco_mb || 0), 0)
    } catch {
      // ignore stats errors
    }

    return NextResponse.json(
      {
        config,
        dbStats: {
          totalRows,
          totalStorageMb,
        },
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/configuracoes:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const saved = await saveConfiguracoes(
      {
        nome_plataforma: body.nome_plataforma,
        email_suporte: body.email_suporte,
        whatsapp_suporte: body.whatsapp_suporte,
        dias_trial: Number(body.dias_trial ?? 7),
        limite_carros_starter: Number(body.limite_carros_starter ?? 20),
        limite_carros_premium: Number(body.limite_carros_premium ?? 40),
        limite_carros_enterprise: Number(body.limite_carros_enterprise ?? 100),
        emails_cobranca_ativo: Boolean(body.emails_cobranca_ativo),
      },
      getRequestIp(req)
    )
    return NextResponse.json(saved, { status: 200 })
  } catch (err: any) {
    console.error('Error in PUT /api/admin/configuracoes:', err)
    return NextResponse.json({ error: err.message || 'Erro ao salvar configurações' }, { status: 500 })
  }
}
