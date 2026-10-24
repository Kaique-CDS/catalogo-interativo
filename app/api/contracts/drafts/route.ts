import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { getStoreContractSettings, isContractsEnabled } from '@/lib/contracts/module-guard'
import { encryptField, decryptField } from '@/lib/security/field-encryption'

export const dynamic = 'force-dynamic'

const PII_FIELDS = ['cpf_cnpj', 'rg_ie', 'cnh', 'email', 'phone', 'address', 'zip', 'rep_cpf', 'birth_date']

function encryptPartyPII(party: any): any {
  if (!party || typeof party !== 'object') return party
  const cloned = { ...party }
  for (const field of PII_FIELDS) {
    if (cloned[field] && typeof cloned[field] === 'string') {
      cloned[field] = encryptField(cloned[field])
    }
  }
  return cloned
}

function decryptPartyPII(party: any): any {
  if (!party || typeof party !== 'object') return party
  const cloned = { ...party }
  for (const field of PII_FIELDS) {
    if (cloned[field] && typeof cloned[field] === 'string') {
      cloned[field] = decryptField(cloned[field])
    }
  }
  return cloned
}

function sanitizeDraftPayloadForStorage(payload: any, type: string): any {
  if (!payload || typeof payload !== 'object') return {}
  const cloned = { ...payload }

  if (cloned.buyer) cloned.buyer = encryptPartyPII(cloned.buyer)
  if (cloned.grantor) cloned.grantor = encryptPartyPII(cloned.grantor)
  if (cloned.grantee) cloned.grantee = encryptPartyPII(cloned.grantee)

  return cloned
}

function decryptDraftPayload(payload: any, type: string): any {
  if (!payload || typeof payload !== 'object') return {}
  const cloned = { ...payload }

  if (cloned.buyer) cloned.buyer = decryptPartyPII(cloned.buyer)
  if (cloned.grantor) cloned.grantor = decryptPartyPII(cloned.grantor)
  if (cloned.grantee) cloned.grantee = decryptPartyPII(cloned.grantee)

  return cloned
}

export async function GET(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const type = searchParams.get('type') // 'venda_veiculo' | 'procuracao'
    const list = searchParams.get('list') === 'true'

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para esta loja.' },
        { status: 403 }
      )
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    // 1. Se for listagem de todos os rascunhos para o painel
    if (list) {
      const { data, error } = await supabase
        .from('contract_drafts')
        .select('*')
        .eq('store_id', store.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar rascunhos:', error.message)
        return NextResponse.json({ drafts: [] })
      }

      const drafts = (data || []).map((d) => ({
        id: d.id,
        type: d.type,
        step: d.step,
        updated_at: d.updated_at,
        created_at: d.created_at,
        title: d.type === 'procuracao' ? 'Procuração em Rascunho' : 'Contrato de Venda em Rascunho',
        vehicle_summary: d.payload?.vehicle ? `${d.payload.vehicle.brand || ''} ${d.payload.vehicle.model || ''}`.trim() : null,
      }))

      return NextResponse.json({ drafts })
    }

    // 2. Busca rascunho específico do tipo solicitado
    const targetType = type || 'venda_veiculo'
    const { data, error } = await supabase
      .from('contract_drafts')
      .select('*')
      .eq('store_id', store.id)
      .eq('type', targetType)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ draft: null })
    }

    // Descriptografa campos sensíveis do payload
    const decryptedPayload = decryptDraftPayload(data.payload, targetType)

    return NextResponse.json({
      draft: {
        id: data.id,
        type: data.type,
        step: data.step,
        payload: decryptedPayload,
        updated_at: data.updated_at,
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/contracts/drafts:', err)
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
    const { slug, type = 'venda_veiculo', step = 1, payload = {} } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para salvar rascunhos desta loja.' },
        { status: 403 }
      )
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    // Criptografa PII antes de persistir no banco de dados
    const encryptedPayload = sanitizeDraftPayloadForStorage(payload, type)

    const draftRecord = {
      store_id: store.id,
      user_id: auth.userId || null,
      type,
      step: Number(step) || 1,
      payload: encryptedPayload,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('contract_drafts')
      .upsert(draftRecord, { onConflict: 'store_id,type' })
      .select('id, updated_at')
      .single()

    if (error) {
      console.error('Falha ao salvar rascunho no banco:', error.message)
      return NextResponse.json({ error: 'Não foi possível salvar o rascunho.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      draft_id: data.id,
      updated_at: data.updated_at,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/drafts:', err)
    return NextResponse.json({ error: err.message || 'Erro ao salvar rascunho.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para excluir rascunhos desta loja.' },
        { status: 403 }
      )
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    let query = supabase.from('contract_drafts').delete().eq('store_id', store.id)

    if (id) {
      query = query.eq('id', id)
    } else if (type) {
      query = query.eq('type', type)
    }

    const { error } = await query

    if (error) {
      console.error('Erro ao excluir rascunho:', error.message)
      return NextResponse.json({ error: 'Erro ao excluir rascunho.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro em DELETE /api/contracts/drafts:', err)
    return NextResponse.json({ error: err.message || 'Erro ao processar exclusão.' }, { status: 500 })
  }
}
