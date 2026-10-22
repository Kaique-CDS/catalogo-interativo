import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPER_ADMIN_COOKIE, verifySuperAdminToken } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/supabase/erp-db'

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
    const supabase = createAdminClient()
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, slug, contracts_enabled, modules, updated_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar stores no Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { stores: stores || [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    )
  } catch (err: any) {
    console.error('Error in GET /api/admin/clientes/modules:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SUPER_ADMIN_COOKIE)?.value
    const isAuthorized = await verifySuperAdminToken(token)

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Não autorizado. Faça login como Super Admin.' }, { status: 401 })
    }

    const body = await req.json()
    const { store_id, slug, contracts_enabled } = body as {
      store_id?: string
      slug?: string
      contracts_enabled: boolean
    }

    if (!store_id && !slug) {
      return NextResponse.json({ error: 'store_id ou slug é obrigatório.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const query = supabase.from('stores').select('id, name, slug, modules, contracts_enabled')
    const { data: store, error: fetchErr } = store_id
      ? await query.eq('id', store_id).maybeSingle()
      : await query.eq('slug', slug!).maybeSingle()

    if (fetchErr || !store) {
      return NextResponse.json({ error: 'Loja não encontrada no banco.' }, { status: 404 })
    }

    const currentModules = (typeof store.modules === 'object' && store.modules !== null)
      ? (store.modules as Record<string, any>)
      : {}

    const updatedModules = {
      ...currentModules,
      contracts: Boolean(contracts_enabled),
    }

    const { error: updateErr } = await supabase
      .from('stores')
      .update({
        contracts_enabled: Boolean(contracts_enabled),
        modules: updatedModules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', store.id)

    if (updateErr) {
      console.error('Erro ao atualizar módulo de contratos na tabela stores:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Registra log de auditoria
    try {
      await insertAuditLog({
        tipo: 'edicao',
        criticidade: 'normal',
        descricao: `Módulo de Contratos ${contracts_enabled ? 'ATIVADO' : 'DESATIVADO'} para o tenant "${store.name || store.slug}"`,
        ator: 'Super Admin',
        ip: getRequestIp(req),
      })
    } catch (logErr) {
      console.error('Erro ao registrar log de auditoria de módulo:', logErr)
    }

    return NextResponse.json({
      success: true,
      store_id: store.id,
      slug: store.slug,
      contracts_enabled: Boolean(contracts_enabled),
      modules: updatedModules,
    })
  } catch (err: any) {
    console.error('Error in POST /api/admin/clientes/modules:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
