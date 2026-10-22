export type TicketType = 'melhoria' | 'problema' | 'duvida'
export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido'

export interface TicketAttachment {
  id: string
  ticket_id: string
  public_id: string
  url: string
  file_size: number
  created_at: string
}

export interface TicketEvent {
  id: string
  ticket_id: string
  status_from: string | null
  status_to: string
  note: string | null
  created_by: string | null
  created_at: string
}

export interface Ticket {
  id: string
  tenant_id: string
  ticket_number: number
  title: string
  description: string
  type: TicketType
  status: TicketStatus
  resolution_note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  prints_deleted_at: string | null
  attachments?: TicketAttachment[]
  events?: TicketEvent[]
}

/**
 * Gera texto em Markdown estruturado para colar direto em IAs de código
 * (Claude, ChatGPT, Gemini, Cursor, etc).
 */
export function generateTicketMarkdown(ticket: Ticket, tenantName?: string): string {
  const typeLabels: Record<TicketType, string> = {
    melhoria: 'Melhoria',
    problema: 'Problema',
    duvida: 'Dúvida',
  }
  const statusLabels: Record<TicketStatus, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    resolvido: 'Resolvido',
  }

  const dateFormatted = new Date(ticket.created_at).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let md = `### Ticket #${ticket.ticket_number} - [${typeLabels[ticket.type] || ticket.type}] ${ticket.title}\n`
  md += `- **Empresa:** ${tenantName ? `${tenantName} (${ticket.tenant_id})` : ticket.tenant_id}\n`
  md += `- **Tipo:** ${typeLabels[ticket.type] || ticket.type}\n`
  md += `- **Status:** ${statusLabels[ticket.status] || ticket.status}\n`
  md += `- **Data de Abertura:** ${dateFormatted}\n`
  if (ticket.created_by) md += `- **Criado por:** ${ticket.created_by}\n`
  if (ticket.resolved_at) {
    const resDate = new Date(ticket.resolved_at).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    md += `- **Resolvido em:** ${resDate}\n`
  }

  md += `\n#### Descrição:\n${ticket.description}\n`

  if (ticket.resolution_note) {
    md += `\n#### Devolutiva da Equipe VendaZap:\n${ticket.resolution_note}\n`
  }

  if (ticket.attachments && ticket.attachments.length > 0) {
    md += `\n#### Anexos / Prints:\n`
    if (ticket.prints_deleted_at) {
      md += `*(Prints removidos automaticamente da nuvem após 7 dias de resolução)*\n`
    } else {
      ticket.attachments.forEach((att, idx) => {
        md += `- Print ${idx + 1} (${Math.round(att.file_size / 1024)} KB): ${att.url}\n`
      })
    }
  } else {
    md += `\n#### Anexos / Prints:\n- *Nenhum print anexado*\n`
  }

  return md
}
