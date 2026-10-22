import { getLocalContractById, deleteLocalContract } from '@/lib/contracts/cache'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

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
    const { id } = await params
    const supabase = createAdminClient()

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
