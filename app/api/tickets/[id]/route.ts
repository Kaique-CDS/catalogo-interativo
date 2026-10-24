import { NextRequest, NextResponse } from 'next/server'
import {
  updateTicket,
  deleteTicket,
  getTicketById,
  notifyClientTicketUpdate,
  type TicketStatus,
} from '@/lib/tickets-service'
import { getTenantBrand } from '@/lib/tenants'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
    }

    // Busca ticket para validar permissão de tenant
    const existing = await getTicketById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Ticket não encontrado.' }, { status: 404 })
    }

    if (!canAccessTenant(auth, existing.tenant_id)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para alterar tickets de outra loja.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { status, resolution_note, actor } = body

    if (status && !['aberto', 'em_andamento', 'resolvido'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Permitidos: aberto, em_andamento, resolvido.' },
        { status: 400 }
      )
    }

    const updated = await updateTicket(id, {
      status: status as TicketStatus | undefined,
      resolution_note: resolution_note !== undefined ? resolution_note : undefined,
      actor: actor || (auth.isSuperAdmin ? 'Super Admin' : 'Lojista'),
    })

    // Dispara notificação por e-mail para a loja se houve atualização relevante
    try {
      const supabase = createAdminClient()
      const { data: storeData } = await supabase
        .from('stores')
        .select('name, email, contract_email')
        .eq('slug', updated.tenant_id)
        .maybeSingle()

      const brand = getTenantBrand(updated.tenant_id)
      const storeName = storeData?.name || brand.name
      const storeEmail = storeData?.contract_email || storeData?.email || brand.demoStore?.email

      if (storeEmail) {
        notifyClientTicketUpdate(updated, storeName, storeEmail).catch(() => {})
      }
    } catch {}

    return NextResponse.json({ success: true, ticket: updated }, { status: 200 })
  } catch (err: any) {
    console.error('[API TICKETS PATCH]', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar ticket' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
    }

    const existing = await getTicketById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Ticket não encontrado.' }, { status: 404 })
    }

    if (!canAccessTenant(auth, existing.tenant_id)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para excluir tickets de outra loja.' },
        { status: 403 }
      )
    }

    const result = await deleteTicket(id)
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[API TICKETS DELETE]', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir ticket' }, { status: 500 })
  }
}
