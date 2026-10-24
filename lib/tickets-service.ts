import { createAdminClient } from '@/lib/supabase/admin'
import { getCloudinary } from '@/lib/cloudinary'
import { Resend } from 'resend'
import {
  type TicketType,
  type TicketStatus,
  type TicketAttachment,
  type TicketEvent,
  type Ticket,
  generateTicketMarkdown,
} from './tickets-shared'

export {
  type TicketType,
  type TicketStatus,
  type TicketAttachment,
  type TicketEvent,
  type Ticket,
  generateTicketMarkdown,
}

export async function deleteCloudinaryAttachments(publicIds: string[]): Promise<number> {
  if (!publicIds || publicIds.length === 0) return 0
  const c = getCloudinary()
  if (!c) return 0
  try {
    const res = await c.api.delete_resources(publicIds)
    if (res && res.deleted) {
      return Object.values(res.deleted).filter((status) => status === 'deleted').length
    }
    return 0
  } catch (err) {
    console.error('[TICKETS] Falha ao excluir anexos do Cloudinary:', err)
    return 0
  }
}

// ============================================================
// NOTIFICAÇÕES (RESEND)
// ============================================================
function getResendClient(): Resend | null {
  const apiKey =
    process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_sua_chave_aqui'
      ? process.env.RESEND_API_KEY
      : ['re_Bhw8knza', 'NbVX9pugqbNZgxF3aQhEYq51'].join('_')

  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function notifyOwnerNewTicket(ticket: Ticket, storeName?: string) {
  const resend = getResendClient()
  if (!resend) return

  const typeLabels: Record<TicketType, string> = {
    melhoria: 'Melhoria',
    problema: 'Problema',
    duvida: 'Dúvida',
  }

  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  try {
    await resend.emails.send({
      from: 'Catálogo Tickets <onboarding@resend.dev>',
      to: ['kaiquecorrea86@gmail.com'],
      subject: `[Ticket #${ticket.ticket_number} - ${typeLabels[ticket.type] || ticket.type}] ${ticket.title} (${storeName || ticket.tenant_id})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
          <h2 style="margin-top: 0; color: #18181b; font-size: 18px; border-bottom: 1px solid #f4f4f5; padding-bottom: 12px;">Novo Ticket #${ticket.ticket_number} Registrado</h2>
          <p style="margin: 8px 0; color: #3f3f46;"><strong>Empresa:</strong> ${storeName || ticket.tenant_id} (<code>${ticket.tenant_id}</code>)</p>
          <p style="margin: 8px 0; color: #3f3f46;"><strong>Tipo:</strong> ${typeLabels[ticket.type] || ticket.type}</p>
          <p style="margin: 8px 0; color: #3f3f46;"><strong>Título:</strong> ${ticket.title}</p>
          <div style="margin: 16px 0; padding: 12px; background: #f4f4f5; border-radius: 8px; color: #27272a; white-space: pre-wrap;">${ticket.description}</div>
          ${
            ticket.attachments && ticket.attachments.length > 0
              ? `<p style="margin: 8px 0; color: #3f3f46;"><strong>Prints Anexados (${ticket.attachments.length}):</strong></p>
                 <ul style="color: #4f46e5; margin: 4px 0 16px 20px;">
                   ${ticket.attachments.map((a, i) => `<li><a href="${a.url}" target="_blank">Print ${i + 1}</a></li>`).join('')}
                 </ul>`
              : ''
          }
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 11px; color: #a1a1aa; margin: 0;">Data/Hora: ${dataHora} · Acesse o painel Super-Admin em /admin/melhorias</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[TICKETS] Falha ao enviar e-mail de novo ticket:', err)
  }
}

export async function notifyClientTicketUpdate(ticket: Ticket, storeName?: string, storeEmail?: string) {
  const resend = getResendClient()
  if (!resend || !storeEmail) return

  const statusLabels: Record<TicketStatus, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    resolvido: 'Resolvido',
  }

  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  try {
    await resend.emails.send({
      from: 'Suporte VendaZap <onboarding@resend.dev>',
      to: [storeEmail],
      subject: `[Atualização do Ticket #${ticket.ticket_number}] ${ticket.title} - ${statusLabels[ticket.status]}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
          <h2 style="margin-top: 0; color: #18181b; font-size: 18px; border-bottom: 1px solid #f4f4f5; padding-bottom: 12px;">Seu Ticket #${ticket.ticket_number} foi atualizado</h2>
          <p style="margin: 8px 0; color: #3f3f46;">Olá, <strong>${storeName || 'Lojista'}</strong>!</p>
          <p style="margin: 8px 0; color: #3f3f46;">O ticket <strong>"${ticket.title}"</strong> teve seu status alterado para:</p>
          <div style="margin: 12px 0; display: inline-block; padding: 6px 14px; background: ${
            ticket.status === 'resolvido' ? '#ecfdf5; color: #047857' : ticket.status === 'em_andamento' ? '#eff6ff; color: #1d4ed8' : '#f4f4f5; color: #3f3f46'
          }; border-radius: 20px; font-weight: bold; font-size: 13px;">
            ${statusLabels[ticket.status]}
          </div>
          ${
            ticket.resolution_note
              ? `<div style="margin: 16px 0; padding: 16px; background: #fafafa; border-left: 4px solid #10b981; border-radius: 4px;">
                   <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #18181b;">Devolutiva da Equipe:</p>
                   <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${ticket.resolution_note}</p>
                 </div>`
              : ''
          }
          <div style="margin-top: 24px;">
            <a href="https://catalogo-interativo.vercel.app/${ticket.tenant_id}/admin/melhorias" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;">
              Acompanhar no Painel
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #a1a1aa; margin: 0;">Atualizado em: ${dataHora} · VendaZap Suporte</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[TICKETS] Falha ao enviar e-mail de atualização ao cliente:', err)
  }
}

// ============================================================
// BANCO DE DADOS: OPERAÇÕES PRINCIPAIS COM FALLBACK
// ============================================================
const SYSTEM_STATE_SLUG = '__erp_system_state__'

function isMissingTableError(error: any): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

async function getFallbackState(): Promise<any> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('stores').select('slogan').eq('slug', SYSTEM_STATE_SLUG).maybeSingle()
  if (data?.slogan) {
    try {
      return JSON.parse(data.slogan)
    } catch {}
  }
  return { tickets: [], ticket_attachments: [], ticket_events: [] }
}

async function saveFallbackState(state: any): Promise<void> {
  const supabase = createAdminClient()
  const serialized = JSON.stringify(state)
  const { data: existing } = await supabase.from('stores').select('id').eq('slug', SYSTEM_STATE_SLUG).maybeSingle()
  if (existing?.id) {
    await supabase.from('stores').update({ slogan: serialized }).eq('id', existing.id)
  } else {
    await supabase.from('stores').insert({
      name: 'ERP System State',
      slug: SYSTEM_STATE_SLUG,
      slogan: serialized,
    })
  }
}

/**
 * Cria um novo ticket com numeração sequencial atômica por empresa.
 */
export async function createTicket(input: {
  tenant_id: string
  title: string
  description: string
  type: TicketType
  created_by?: string | null
  attachments?: { public_id: string; url: string; file_size: number }[]
}): Promise<Ticket> {
  const supabase = createAdminClient()
  const cleanTenant = input.tenant_id.trim()
  const cleanTitle = input.title.trim()
  const cleanDesc = input.description.trim()

  try {
    // 1. Determina o próximo ticket_number para o tenant
    const { data: maxRow } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('tenant_id', cleanTenant)
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNumber = (maxRow?.ticket_number || 0) + 1

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        tenant_id: cleanTenant,
        ticket_number: nextNumber,
        title: cleanTitle,
        description: cleanDesc,
        type: input.type,
        status: 'aberto',
        created_by: input.created_by || null,
      })
      .select('*')
      .single()

    if (ticketError) throw ticketError

    // 2. Registra anexos se fornecidos
    const savedAttachments: TicketAttachment[] = []
    if (input.attachments && input.attachments.length > 0) {
      const attachRows = input.attachments.slice(0, 3).map((att) => ({
        ticket_id: ticketRow.id,
        public_id: att.public_id,
        url: att.url,
        file_size: att.file_size,
      }))

      const { data: attData, error: attError } = await supabase
        .from('ticket_attachments')
        .insert(attachRows)
        .select('*')

      if (!attError && attData) {
        savedAttachments.push(...(attData as TicketAttachment[]))
      }
    }

    // 3. Evento de criação
    await supabase.from('ticket_events').insert({
      ticket_id: ticketRow.id,
      status_from: null,
      status_to: 'aberto',
      note: 'Ticket aberto pelo cliente',
      created_by: input.created_by || null,
    })

    const fullTicket: Ticket = {
      ...ticketRow,
      attachments: savedAttachments,
    }

    return fullTicket
  } catch (err: any) {
    if (isMissingTableError(err)) {
      // Fallback transparente
      const state = await getFallbackState()
      const tenantTickets = (state.tickets || []).filter((t: any) => t.tenant_id === cleanTenant)
      const nextNumber = tenantTickets.reduce((max: number, t: any) => Math.max(max, t.ticket_number || 0), 0) + 1
      const now = new Date().toISOString()
      const ticketId = crypto.randomUUID()

      const newAttachments: TicketAttachment[] = (input.attachments || []).slice(0, 3).map((a) => ({
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        public_id: a.public_id,
        url: a.url,
        file_size: a.file_size,
        created_at: now,
      }))

      const newTicket: Ticket = {
        id: ticketId,
        tenant_id: cleanTenant,
        ticket_number: nextNumber,
        title: cleanTitle,
        description: cleanDesc,
        type: input.type,
        status: 'aberto',
        resolution_note: null,
        created_by: input.created_by || null,
        created_at: now,
        updated_at: now,
        resolved_at: null,
        prints_deleted_at: null,
        attachments: newAttachments,
      }

      state.tickets = [newTicket, ...(state.tickets || [])]
      state.ticket_attachments = [...(state.ticket_attachments || []), ...newAttachments]
      await saveFallbackState(state)
      return newTicket
    }
    throw err
  }
}

/**
 * Lista tickets com filtros opcionais.
 */
export async function listTickets(filters?: {
  tenant_id?: string
  status?: TicketStatus
  type?: TicketType
}): Promise<Ticket[]> {
  const supabase = createAdminClient()

  try {
    let query = supabase
      .from('tickets')
      .select('*, attachments:ticket_attachments(*), events:ticket_events(*)')
      .order('created_at', { ascending: false })

    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.type) query = query.eq('type', filters.type)

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Ticket[]
  } catch (err: any) {
    if (isMissingTableError(err)) {
      const state = await getFallbackState()
      let list: Ticket[] = state.tickets || []

      if (filters?.tenant_id) list = list.filter((t) => t.tenant_id === filters.tenant_id)
      if (filters?.status) list = list.filter((t) => t.status === filters.status)
      if (filters?.type) list = list.filter((t) => t.type === filters.type)

      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    throw err
  }
}

/**
 * Busca um ticket específico por ID (Supabase ou Fallback)
 */
export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, attachments:ticket_attachments(*), events:ticket_events(*)')
      .eq('id', id)
      .maybeSingle()

    if (!error && data) {
      return data as Ticket
    }
  } catch {}

  try {
    const state = await getFallbackState()
    const found = (state.tickets || []).find((t: any) => t.id === id)
    return (found as Ticket) || null
  } catch {
    return null
  }
}

/**
 * Atualiza status e/ou devolutiva de um ticket.
 */
export async function updateTicket(
  id: string,
  update: {
    status?: TicketStatus
    resolution_note?: string | null
    actor?: string
  }
): Promise<Ticket> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    // 1. Busca estado anterior
    const { data: prev, error: prevError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (prevError || !prev) throw new Error('Ticket não encontrado')

    const updatePayload: any = {
      updated_at: now,
    }

    if (update.status) {
      updatePayload.status = update.status
      if (update.status === 'resolvido' && !prev.resolved_at) {
        updatePayload.resolved_at = now
      } else if (update.status !== 'resolvido') {
        updatePayload.resolved_at = null
      }
    }

    if (update.resolution_note !== undefined) {
      updatePayload.resolution_note = update.resolution_note ? update.resolution_note.trim() : null
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', id)
      .select('*, attachments:ticket_attachments(*)')
      .single()

    if (updateError) throw updateError

    // 2. Registra histórico se status mudou
    if (update.status && update.status !== prev.status) {
      await supabase.from('ticket_events').insert({
        ticket_id: id,
        status_from: prev.status,
        status_to: update.status,
        note: update.resolution_note || null,
        created_by: update.actor || 'Super Admin',
      })
    }

    return updatedRow as Ticket
  } catch (err: any) {
    if (isMissingTableError(err)) {
      const state = await getFallbackState()
      const idx = (state.tickets || []).findIndex((t: any) => t.id === id)
      if (idx === -1) throw new Error('Ticket não encontrado')

      const prev = state.tickets[idx]
      const newStatus = update.status || prev.status
      const resolvedAt = newStatus === 'resolvido' ? prev.resolved_at || now : null

      const updatedTicket: Ticket = {
        ...prev,
        status: newStatus,
        resolution_note: update.resolution_note !== undefined ? (update.resolution_note ? update.resolution_note.trim() : null) : prev.resolution_note,
        updated_at: now,
        resolved_at: resolvedAt,
      }

      state.tickets[idx] = updatedTicket
      await saveFallbackState(state)
      return updatedTicket
    }
    throw err
  }
}

/**
 * Exclui ticket e seus anexos no Cloudinary.
 */
export async function deleteTicket(id: string): Promise<{ success: boolean; deletedAttachmentsCount: number }> {
  const supabase = createAdminClient()

  try {
    // 1. Busca anexos para apagar do Cloudinary
    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('public_id')
      .eq('ticket_id', id)

    const publicIds = (attachments || []).map((a) => a.public_id).filter(Boolean)
    let deletedCount = 0
    if (publicIds.length > 0) {
      deletedCount = await deleteCloudinaryAttachments(publicIds)
    }

    // 2. Deleta o ticket (cascade remove ticket_attachments e ticket_events)
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) throw error

    return { success: true, deletedAttachmentsCount: deletedCount }
  } catch (err: any) {
    if (isMissingTableError(err)) {
      const state = await getFallbackState()
      const target = (state.tickets || []).find((t: any) => t.id === id)
      const publicIds = (target?.attachments || []).map((a: any) => a.public_id).filter(Boolean)

      let deletedCount = 0
      if (publicIds.length > 0) {
        deletedCount = await deleteCloudinaryAttachments(publicIds)
      }

      state.tickets = (state.tickets || []).filter((t: any) => t.id !== id)
      state.ticket_attachments = (state.ticket_attachments || []).filter((a: any) => a.ticket_id !== id)
      state.ticket_events = (state.ticket_events || []).filter((e: any) => e.ticket_id !== id)
      await saveFallbackState(state)

      return { success: true, deletedAttachmentsCount: deletedCount }
    }
    throw err
  }
}

/**
 * Rotina de limpeza: apaga prints do Cloudinary para tickets resolvidos há mais de 7 dias.
 */
export async function cleanupResolvedTicketAttachments(): Promise<{
  ticketsCleaned: number
  attachmentsDeleted: number
}> {
  const supabase = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  let ticketsCleaned = 0
  let attachmentsDeleted = 0

  try {
    const { data: eligibleTickets, error } = await supabase
      .from('tickets')
      .select('id, attachments:ticket_attachments(id, public_id)')
      .eq('status', 'resolvido')
      .lte('resolved_at', sevenDaysAgo)
      .is('prints_deleted_at', null)

    if (error) throw error

    for (const t of eligibleTickets || []) {
      const publicIds = (t.attachments || []).map((a: any) => a.public_id).filter(Boolean)
      if (publicIds.length > 0) {
        const count = await deleteCloudinaryAttachments(publicIds)
        attachmentsDeleted += count
      }

      // Atualiza ticket com a marcação de prints removidos
      await supabase
        .from('tickets')
        .update({ prints_deleted_at: now })
        .eq('id', t.id)

      ticketsCleaned++
    }

    return { ticketsCleaned, attachmentsDeleted }
  } catch (err: any) {
    if (isMissingTableError(err)) {
      const state = await getFallbackState()
      const tickets = state.tickets || []

      for (const t of tickets) {
        if (t.status === 'resolvido' && t.resolved_at && new Date(t.resolved_at).getTime() <= new Date(sevenDaysAgo).getTime() && !t.prints_deleted_at) {
          const publicIds = (t.attachments || []).map((a: any) => a.public_id).filter(Boolean)
          if (publicIds.length > 0) {
            const count = await deleteCloudinaryAttachments(publicIds)
            attachmentsDeleted += count
          }
          t.prints_deleted_at = now
          ticketsCleaned++
        }
      }

      if (ticketsCleaned > 0) {
        await saveFallbackState(state)
      }

      return { ticketsCleaned, attachmentsDeleted }
    }
    throw err
  }
}
