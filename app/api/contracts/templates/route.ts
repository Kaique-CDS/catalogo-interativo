import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { getStoreContractSettings, isContractsEnabled } from '@/lib/contracts/module-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const type = searchParams.get('type') || 'venda_veiculo'

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('store_id', store.id)
      .eq('type', type)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ template: null })
    }

    return NextResponse.json({ template: data })
  } catch (err: any) {
    console.error('Erro em GET /api/contracts/templates:', err)
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, type = 'venda_veiculo', answers = {}, name = 'Padrão da Loja' } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    const record = {
      store_id: store.id,
      type,
      name,
      answers,
      is_default: true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .upsert(record, { onConflict: 'store_id,type' })
      .select('id, updated_at')
      .single()

    if (error) {
      console.error('Erro ao salvar modelo de cláusulas:', error.message)
      return NextResponse.json({ error: 'Não foi possível salvar o modelo padrão.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template_id: data.id })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/templates:', err)
    return NextResponse.json({ error: err.message || 'Erro ao processar modelo.' }, { status: 500 })
  }
}
