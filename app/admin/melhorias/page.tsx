'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Ticket,
  Filter,
  Search,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Trash2,
  ShieldAlert,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  type Ticket as TicketModel,
  type TicketType,
  type TicketStatus,
  generateTicketMarkdown,
} from '@/lib/tickets-shared'

const TYPE_CONFIG: Record<
  TicketType,
  { label: string; className: string; icon: React.ElementType }
> = {
  melhoria: {
    label: 'Melhoria',
    className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    icon: Sparkles,
  },
  problema: {
    label: 'Problema',
    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: AlertCircle,
  },
  duvida: {
    label: 'Dúvida',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: HelpCircle,
  },
}

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  aberto: {
    label: 'Aberto',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  em_andamento: {
    label: 'Em Andamento',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Loader2,
  },
  resolvido: {
    label: 'Resolvido',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SuperAdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketModel[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Edição de Devolutiva / Status
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<TicketStatus>('aberto')
  const [editNote, setEditNote] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/tickets?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      if (!silent) toast.error('Erro ao carregar tickets do banco.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets(false)
  }, [loadTickets])

  // Lista de Tenants únicos para o filtro
  const uniqueTenants = Array.from(new Set(tickets.map((t) => t.tenant_id))).filter(Boolean)

  // Filtragem
  const filteredTickets = tickets.filter((t) => {
    if (selectedTenant !== 'all' && t.tenant_id !== selectedTenant) return false
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false
    if (selectedType !== 'all' && t.type !== selectedType) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = (t.title || '').toLowerCase().includes(q)
      const matchDesc = (t.description || '').toLowerCase().includes(q)
      const matchTenant = (t.tenant_id || '').toLowerCase().includes(q)
      const matchNum = String(t.ticket_number).includes(q)
      if (!matchTitle && !matchDesc && !matchTenant && !matchNum) return false
    }
    return true
  })

  // Copiar Ticket para IA em Markdown
  const handleCopyMarkdown = (ticket: TicketModel) => {
    const md = generateTicketMarkdown(ticket)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(md)
      setCopiedId(ticket.id)
      toast.success(`Ticket #${ticket.ticket_number} copiado em Markdown para colar na IA!`)
      setTimeout(() => setCopiedId(null), 2500)
    }
  }

  // Abrir painel de edição do ticket
  const startEditing = (ticket: TicketModel) => {
    setActiveEditingId(ticket.id)
    setEditStatus(ticket.status)
    setEditNote(ticket.resolution_note || '')
  }

  // Salvar atualização do ticket
  const handleSaveEdit = async (ticketId: string) => {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          resolution_note: editNote,
          actor: 'Super Admin',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar atualização')

      toast.success('Ticket atualizado e cliente notificado!')
      setActiveEditingId(null)
      loadTickets(true)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar ticket.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Excluir ticket
  const handleDeleteTicket = async (ticketId: string, ticketNumber: number) => {
    if (!window.confirm(`Tem certeza que deseja excluir o Ticket #${ticketNumber}? Todos os prints associados no Cloudinary serão removidos.`)) {
      return
    }

    setDeletingId(ticketId)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir ticket')

      toast.success(`Ticket #${ticketNumber} excluído! (${data.deletedAttachmentsCount || 0} prints removidos da nuvem)`)
      loadTickets(true)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao excluir ticket.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Gestão de Tickets (Super-Admin)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Painel unificado de chamados de todas as lojas. Altere status, envie devolutivas e copie solicitações em Markdown para a IA de código.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTickets(false)}
          disabled={loading}
          className="self-start sm:self-auto gap-2 rounded-xl text-xs dark:border-zinc-700"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Busca textual */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, texto ou #..."
                className="pl-9 rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-xs h-9"
              />
            </div>

            {/* Filtro Empresa */}
            <div>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full h-9 rounded-xl px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">Todas as Lojas ({uniqueTenants.length})</option>
                {uniqueTenants.map((ten) => (
                  <option key={ten} value={ten}>
                    {ten}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-xl px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="aberto">Abertos</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="resolvido">Resolvidos</option>
              </select>
            </div>

            {/* Filtro Tipo */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-9 rounded-xl px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">Todos os Tipos</option>
                <option value="melhoria">Melhoria</option>
                <option value="problema">Problema / Bug</option>
                <option value="duvida">Dúvida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Chamados */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            Carregando tickets da plataforma...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Ticket className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nenhum ticket encontrado</p>
            <p className="text-xs text-zinc-400 mt-1">
              {search || selectedTenant !== 'all' || selectedStatus !== 'all' || selectedType !== 'all'
                ? 'Nenhum ticket corresponde aos filtros selecionados.'
                : 'Nenhum chamado aberto na plataforma até o momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((t) => {
              const typeCfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.melhoria
              const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.aberto
              const StatusIcon = statusCfg.icon
              const TypeIcon = typeCfg.icon
              const isEditing = activeEditingId === t.id
              const isCopied = copiedId === t.id
              const isDeleting = deletingId === t.id

              return (
                <Card
                  key={t.id}
                  className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                >
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Header do Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                          #{t.ticket_number}
                        </span>

                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-zinc-400" />
                          {t.tenant_id}
                        </span>

                        <span
                          className={cn(
                            'text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1',
                            typeCfg.className
                          )}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </span>

                        <span
                          className={cn(
                            'text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5',
                            statusCfg.className
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Botão Copiar para IA */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyMarkdown(t)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl gap-1.5 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copiar p/ IA
                            </>
                          )}
                        </Button>

                        {/* Botão Responder / Devolutiva */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => (isEditing ? setActiveEditingId(null) : startEditing(t))}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl gap-1.5 dark:border-zinc-700"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {isEditing ? 'Fechar' : 'Devolutiva'}
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => handleDeleteTicket(t.id, t.ticket_number)}
                          className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Título e Descrição */}
                    <div>
                      <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                        {t.title}
                      </h2>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed whitespace-pre-wrap">
                        {t.description}
                      </p>
                    </div>

                    {/* Anexos de Prints */}
                    {t.attachments && t.attachments.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-zinc-400 mb-1.5">
                          Prints Anexados ({t.attachments.length}):
                        </p>
                        {t.prints_deleted_at ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <ShieldAlert className="h-4 w-4 text-zinc-400 shrink-0" />
                            <span>Prints removidos automaticamente da nuvem após 7 dias de resolução</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {t.attachments.map((att, i) => (
                              <a
                                key={att.id || i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 aspect-video group block shadow-xs"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att.url}
                                  alt={`Print ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                                  <ExternalLink className="h-3 w-3" /> Ver
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Devolutiva Atual (se já preenchida e não estiver editando) */}
                    {t.resolution_note && !isEditing && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Devolutiva Enviada ao Cliente:
                          </p>
                          {t.resolved_at && (
                            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                              Resolvido em {formatDate(t.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {t.resolution_note}
                        </p>
                      </div>
                    )}

                    {/* Formulário de Edição de Status e Devolutiva */}
                    {isEditing && (
                      <div className="p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                            Alterar Status e Devolutiva para o Cliente
                          </p>
                        </div>

                        {/* Seletor de Status */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Status do Chamado:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['aberto', 'em_andamento', 'resolvido'] as TicketStatus[]).map((st) => {
                              const sCfg = STATUS_CONFIG[st]
                              const SIcon = sCfg.icon
                              const isSel = editStatus === st
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setEditStatus(st)}
                                  className={cn(
                                    'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all',
                                    isSel
                                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                  )}
                                >
                                  <SIcon className="h-3.5 w-3.5" />
                                  <span>{sCfg.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Campo de Devolutiva */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Devolutiva / Resposta Final (visível para o cliente no painel e enviada por e-mail):
                          </label>
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Escreva a resposta para o cliente explicando a resolução, ajuste realizado ou esclarecimento da dúvida..."
                            rows={3}
                            className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-xs leading-relaxed"
                          />
                        </div>

                        {/* Ações de Salvar */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveEditingId(null)}
                            className="h-8 text-xs rounded-xl"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingEdit}
                            onClick={() => handleSaveEdit(t.id)}
                            className="h-8 px-4 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 gap-1.5"
                          >
                            {savingEdit ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
                              </>
                            ) : (
                              'Salvar e Notificar Cliente'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Rodapé com Datas */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Aberto em {formatDate(t.created_at)}</span>
                      {t.updated_at && t.updated_at !== t.created_at && (
                        <span>Última atualização: {formatDate(t.updated_at)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
