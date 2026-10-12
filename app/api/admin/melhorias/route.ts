import { NextRequest, NextResponse } from 'next/server'
import { listMelhorias, createMelhoria, deleteMelhoria, type MelhoriaTipo } from '@/lib/supabase/erp-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function mapCategoryToDbTipo(raw: string): MelhoriaTipo {
  const norm = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (norm === 'urgente') return 'urgente'
  if (norm === 'bug') return 'bug'
  if (norm === 'ideia' || norm === 'analise') return 'analise'
  if (norm === 'melhoria' || norm === 'feature') return 'feature'
  return 'feature'
}

export async function GET() {
  try {
    const melhorias = await listMelhorias()
    return NextResponse.json(
      { melhorias },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
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

    const finalTipo = mapCategoryToDbTipo(tipo)

    const melhoria = await createMelhoria({
      tipo: finalTipo,
      titulo: String(titulo).trim(),
      descricao: descricao ? String(descricao).trim() : null,
    })

    return NextResponse.json(
      { melhoria },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
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
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/melhorias:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir melhoria' }, { status: 500 })
  }
}
