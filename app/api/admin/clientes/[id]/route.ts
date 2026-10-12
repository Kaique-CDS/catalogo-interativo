import { NextRequest, NextResponse } from 'next/server'
import { updateCliente, deleteCliente } from '@/lib/supabase/erp-db'

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await updateCliente(id, body, getRequestIp(req))
    return NextResponse.json(updated, { status: 200 })
  } catch (err: any) {
    console.error('Error in PUT /api/admin/clientes/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteCliente(id, getRequestIp(req))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/clientes/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir cliente' }, { status: 500 })
  }
}
