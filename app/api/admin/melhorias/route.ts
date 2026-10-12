import { NextRequest, NextResponse } from 'next/server'
import { listMelhorias, createMelhoria, deleteMelhoria, type MelhoriaTipo } from '@/lib/supabase/erp-db'

export async function GET() {
  try {
    const list = await listMelhorias()
    return NextResponse.json(list, { status: 200 })
  } catch (err: any) {
    console.error('Error in GET /api/admin/melhorias:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar melhorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, titulo, descricao } = body

    if (!tipo || !titulo) {
      return NextResponse.json({ error: 'Tipo e título são obrigatórios' }, { status: 400 })
    }

    const normTipo = String(tipo)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') as MelhoriaTipo

    const validTipos: MelhoriaTipo[] = ['urgente', 'feature', 'bug', 'analise']
    const finalTipo: MelhoriaTipo = validTipos.includes(normTipo) ? normTipo : 'feature'

    const created = await createMelhoria({
      tipo: finalTipo,
      titulo: String(titulo).trim(),
      descricao: descricao ? String(descricao).trim() : null,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/admin/melhorias:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar melhoria' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }
    await deleteMelhoria(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/melhorias:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir melhoria' }, { status: 500 })
  }
}
