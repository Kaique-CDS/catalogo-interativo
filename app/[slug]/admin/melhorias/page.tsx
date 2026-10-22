'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Ticket,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MessageCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  X,
  Upload,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Ticket as TicketModel, TicketType, TicketStatus } from '@/lib/tickets-shared'

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
    label: 'Problema / Bug',
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

// Compressão no navegador antes do upload (Canvas para WebP, redimensionamento se > 1920px)
async function compressImageInBrowser(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(compressed)
            } else {
              resolve(file)
            }
          },
          'image/webp',
          0.85
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

export default function ClientTicketsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tickets, setTickets] = useState<TicketModel[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TicketType>('melhoria')
  const [selectedPrints, setSelectedPrints] = useState<{ file: File; preview: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadTickets = useCallback(
    async (silent = false) => {
      if (!slug) return
      if (!silent) setLoading(true)
      try {
        const res = await fetch(`/api/tickets?tenant_id=${encodeURIComponent(slug)}&t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setTickets(data.tickets || [])
        }
      } catch {
        if (!silent) toast.error('Não foi possível carregar os tickets.')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [slug]
  )

  useEffect(() => {
    loadTickets(false)
  }, [loadTickets])

  const handlePrintSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = 3 - selectedPrints.length
    if (remainingSlots <= 0) {
      toast.error('Você já atingiu o limite de 3 prints por chamado.')
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    const newItems: { file: File; preview: string }[] = []

    for (const rawFile of filesToProcess) {
      if (!rawFile.type.startsWith('image/')) {
        toast.error(`"${rawFile.name}" não é uma imagem válida. Use JPG, PNG ou WebP.`)
        continue
      }

      // Comprime no navegador
      const toastId = toast.loading(`Comprimindo imagem "${rawFile.name}"...`)
      const compressed = await compressImageInBrowser(rawFile)
      toast.dismiss(toastId)

      if (compressed.size > 2 * 1024 * 1024) {
        toast.error(`"${compressed.name}" ainda excede 2 MB após compressão.`)
        continue
      }

      newItems.push({
        file: compressed,
        preview: URL.createObjectURL(compressed),
      })
    }

    setSelectedPrints((prev) => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePrint = (index: number) => {
    setSelectedPrints((prev) => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[index].preview)
      copy.splice(index, 1)
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanTitle = title.trim()
    const cleanDesc = description.trim()

    if (!cleanTitle || cleanTitle.length < 3) {
      toast.error('Por favor, informe um título claro para o ticket.')
      return
    }

    if (!cleanDesc || cleanDesc.length < 5) {
      toast.error('Por favor, descreva a sua dúvida, problema ou melhoria em detalhes.')
      return
    }

    setIsSubmitting(true)
    setFallbackWhatsappUrl(null)

    const whatsappMessage = `[Ticket - ${TYPE_CONFIG[type].label}]\nTítulo: ${cleanTitle}\nDescrição: ${cleanDesc}`
    const whatsappUrl = `https://wa.me/5511993270543?text=${encodeURIComponent(whatsappMessage)}`

    try {
      const formData = new FormData()
      formData.append('tenant_id', slug)
      formData.append('title', cleanTitle)
      formData.append('description', cleanDesc)
      formData.append('type', type)

      for (const item of selectedPrints) {
        formData.append('prints', item.file)
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar ticket')
      }

      toast.success(`Ticket #${data.ticket.ticket_number} aberto com sucesso!`)

      // Limpa formulário
      setTitle('')
      setDescription('')
      setType('melhoria')
      selectedPrints.forEach((p) => URL.revokeObjectURL(p.preview))
      setSelectedPrints([])

      // Recarrega lista
      loadTickets(true)

      // Abre WhatsApp
      const isForeground =
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        document.hasFocus()

      if (isForeground) {
        const popup = window.open(whatsappUrl, '_blank')
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setFallbackWhatsappUrl(whatsappUrl)
        }
      } else {
        setFallbackWhatsappUrl(whatsappUrl)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar ticket.')
      setFallbackWhatsappUrl(whatsappUrl)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Central de Tickets & Suporte
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Abra chamados para melhorias, dúvidas ou reporte problemas. Acompanhe a devolutiva da equipe diretamente aqui.
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
          Atualizar Lista
        </Button>
      </div>

      {/* Formulário de Abertura de Ticket */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-500" />
            Abrir Novo Chamado
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Preencha os campos abaixo e anexe prints se necessário (máx. 3 imagens de 2 MB).
          </p>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo do Ticket */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Tipo do Chamado *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['melhoria', 'problema', 'duvida'] as TicketType[]).map((t) => {
                  const cfg = TYPE_CONFIG[t]
                  const Icon = cfg.icon
                  const isSelected = type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all',
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Título do Chamado *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ajustar botão de filtro na busca de seminovos"
                maxLength={100}
                className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-sm"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Descrição Detalhada *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que deseja solicitar, o comportamento esperado ou os passos para reproduzir o problema..."
                rows={4}
                maxLength={2000}
                className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-sm leading-relaxed"
              />
            </div>

            {/* Anexos de Prints */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                  Prints de Tela (até 3 imagens)
                </label>
                <span className="text-[11px] text-zinc-400">
                  {selectedPrints.length} de 3 anexados
                </span>
              </div>

              {/* Lista de Previews */}
              {selectedPrints.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedPrints.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.preview}
                        alt={`Print ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePrint(idx)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Upload */}
              {selectedPrints.length < 3 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handlePrintSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-dashed border-zinc-300 dark:border-zinc-700 text-xs gap-2 py-5"
                  >
                    <Upload className="h-4 w-4 text-zinc-400" />
                    <span>Selecionar Print ou Foto da Tela (JPG, PNG ou WebP até 2 MB)</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-xl text-xs h-11 px-6 gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando Chamado...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Abrir Chamado
                  </>
                )}
              </Button>

              {fallbackWhatsappUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.open(fallbackWhatsappUrl, '_blank')
                    setFallbackWhatsappUrl(null)
                  }}
                  className="w-full sm:w-auto gap-2 rounded-xl text-xs font-bold h-11 px-5 border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir no WhatsApp
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Chamados da Empresa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Chamados Anteriores ({tickets.length})
          </h2>
          <p className="text-xs text-zinc-400">Acompanhamento e Devolutivas</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando chamados...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Ticket className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nenhum chamado aberto</p>
            <p className="text-xs text-zinc-400 mt-1">
              Quando você registrar uma solicitação ou dúvida, ela aparecerá aqui para acompanhamento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const typeCfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.melhoria
              const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.aberto
              const StatusIcon = statusCfg.icon
              const TypeIcon = typeCfg.icon

              return (
                <Card
                  key={t.id}
                  className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    {/* Linha 1: Badges de Número, Tipo e Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          #{t.ticket_number}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1',
                            typeCfg.className
                          )}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                          {formatDate(t.created_at)}
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
                    </div>

                    {/* Título e Descrição */}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {t.title}
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap">
                        {t.description}
                      </p>
                    </div>

                    {/* Prints Anexados */}
                    {t.attachments && t.attachments.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-zinc-500 mb-1.5">
                          Prints Anexados:
                        </p>
                        {t.prints_deleted_at ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <ShieldAlert className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>Prints removidos da nuvem após 7 dias de resolução</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {t.attachments.map((att, i) => (
                              <a
                                key={att.id || i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 aspect-video group block"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att.url}
                                  alt={`Print ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                                  <ExternalLink className="h-3 w-3" /> Ver
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Devolutiva da Equipe */}
                    {t.resolution_note && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Devolutiva da Equipe VendaZap:
                          </p>
                          {t.resolved_at && (
                            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                              Respondido em {formatDate(t.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {t.resolution_note}
                        </p>
                      </div>
                    )}
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
