import { NextRequest, NextResponse } from 'next/server'
import {
  updateTicket,
  deleteTicket,
  notifyClientTicketUpdate,
  type TicketStatus,
} from '@/lib/tickets-service'
import { getTenantBrand } from '@/lib/tenants'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
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
      actor: actor || 'Super Admin',
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
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
    }

    const result = await deleteTicket(id)
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[API TICKETS DELETE]', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir ticket' }, { status: 500 })
  }
}
