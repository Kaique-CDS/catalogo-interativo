import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocalContractById, deleteLocalContract } from '@/lib/contracts/cache'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    let contract: any = null

    if (!id.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, contract_signers(*), contract_events(*)')
          .eq('id', id)
          .maybeSingle()

        if (!error && data) {
          contract = data
        }
      } catch {}
    }

    if (!contract) {
      contract = getLocalContractById(id)
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 })
    }

    const contractTenant = contract.tenant_id || contract.store?.slug || 'll-multimarcas'
    if (!canAccessTenant(auth, contractTenant)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para visualizar contratos de outra loja.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ contract })
  } catch (err: any) {
    console.error('Error in GET /api/contracts/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    // 1. Busca contrato para validar tenant antes de modificar
    let existing: any = null
    if (!id.startsWith('local-')) {
      const { data } = await supabase.from('contracts').select('tenant_id').eq('id', id).maybeSingle()
      existing = data
    } else {
      existing = getLocalContractById(id)
    }

    if (existing) {
      const contractTenant = existing.tenant_id || 'll-multimarcas'
      if (!canAccessTenant(auth, contractTenant)) {
        return NextResponse.json(
          { error: 'Acesso negado: você não tem permissão para alterar contratos de outra loja.' },
          { status: 403 }
        )
      }
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) updatePayload.status = body.status
    if (body.notes !== undefined) updatePayload.notes = body.notes
    if (body.clauses) updatePayload.clauses = body.clauses

    const { data, error } = await supabase
      .from('contracts')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, contract: data })
  } catch (err: any) {
    console.error('Error in PATCH /api/contracts/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Valida permissão do tenant antes de deletar
    let existing: any = null
    if (!id.startsWith('local-')) {
      const { data } = await supabase.from('contracts').select('tenant_id').eq('id', id).maybeSingle()
      existing = data
    } else {
      existing = getLocalContractById(id)
    }

    if (existing) {
      const contractTenant = existing.tenant_id || 'll-multimarcas'
      if (!canAccessTenant(auth, contractTenant)) {
        return NextResponse.json(
          { error: 'Acesso negado: você não tem permissão para excluir contratos de outra loja.' },
          { status: 403 }
        )
      }
    }

    deleteLocalContract(id)

    // Soft delete para não violar integridade nem histórico
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'cancelado',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registra evento de cancelamento
    try {
      await supabase.from('contract_events').insert([
        {
          contract_id: id,
          event_type: 'cancelado',
          description: 'Contrato cancelado / excluído pelo usuário',
        },
      ])
    } catch {
      // Ignora erro de evento
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in DELETE /api/contracts/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
