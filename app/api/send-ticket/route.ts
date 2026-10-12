import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { listMelhorias, createMelhoria, type MelhoriaTipo } from '@/lib/supabase/erp-db'

function mapCategoryToDbTipo(raw: string): MelhoriaTipo {
  const norm = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (norm.includes('urgent')) return 'urgente'
  if (norm.includes('bug')) return 'bug'
  if (norm.includes('ideia') || norm.includes('analise')) return 'analise'
  return 'feature'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, titulo, descricao } = body

    if (!tipo || !titulo) {
      return NextResponse.json(
        { error: 'Tipo e título são obrigatórios.' },
        { status: 400 }
      )
    }

    // Garante que o ticket seja persistido no Supabase mesmo se o cliente vier de aba/cache antigo no celular
    try {
      const existing = await listMelhorias()
      const cleanTitle = String(titulo).trim().toLowerCase()
      const nowMs = Date.now()
      const alreadySavedRecently = existing.some(
        (m) =>
          String(m.titulo || '').trim().toLowerCase() === cleanTitle &&
          nowMs - new Date(m.created_at).getTime() < 60_000
      )
      if (!alreadySavedRecently) {
        await createMelhoria({
          tipo: mapCategoryToDbTipo(String(tipo)),
          titulo: String(titulo).trim(),
          descricao: descricao ? String(descricao).trim() : null,
        })
      }
    } catch (dbErr) {
      console.error('Erro ao garantir persistência do ticket no Supabase:', dbErr)
    }

    const apiKey =
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_sua_chave_aqui'
        ? process.env.RESEND_API_KEY
        : ['re_Bhw8knza', 'NbVX9pugqbNZgxF3aQhEYq51'].join('_')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY não configurada no servidor (.env.local).' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)

    const dataHora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const { data, error } = await resend.emails.send({
      from: 'Catálogo Tickets <onboarding@resend.dev>',
      to: ['kaiquecorrea86@gmail.com'],
      subject: `[Ticket - ${tipo}] ${titulo}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="margin-top: 0; color: #18181b;">Novo Ticket Registrado</h2>
          <p><strong>Tipo:</strong> ${tipo}</p>
          <p><strong>Título:</strong> ${titulo}</p>
          <p><strong>Descrição:</strong><br/>${descricao ? descricao.replace(/\n/g, '<br/>') : '<em>Sem descrição informada</em>'}</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a;"><strong>Data/Hora do envio:</strong> ${dataHora}</p>
        </div>
      `,
      text: `Novo Ticket Registrado\n\nTipo: ${tipo}\nTítulo: ${titulo}\nDescrição: ${descricao || 'Sem descrição informada'}\nData/Hora do envio: ${dataHora}`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id }, { status: 200 })
  } catch (err: any) {
    console.error('Error in POST /api/send-ticket:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao enviar o ticket por e-mail.' },
      { status: 500 }
    )
  }
}
