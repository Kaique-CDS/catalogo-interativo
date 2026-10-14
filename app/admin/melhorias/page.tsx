'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Lightbulb,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Bug,
  BarChart2,
  MessageCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ErpMelhoria, MelhoriaTipo } from '@/lib/supabase/erp-db'

const CATEGORIES: MelhoriaTipo[] = ['urgente', 'feature', 'bug', 'analise']

const categoryConfig: Record<
  MelhoriaTipo,
  { label: string; className: string; icon: React.ElementType }
> = {
  urgente: {
    label: 'Urgente',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    icon: AlertCircle,
  },
  feature: {
    label: 'Melhoria / Feature',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    icon: Sparkles,
  },
  bug: {
    label: 'Bug',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    icon: Bug,
  },
  analise: {
    label: 'Ideia / Análise',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    icon: BarChart2,
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

export default function SuperAdminMelhoriasPage() {
  const [notes, setNotes] = useState<ErpMelhoria[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MelhoriaTipo>('feature')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState<string | null>(null)

  const loadMelhorias = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/admin/melhorias?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!res.ok) throw new Error('Falha ao carregar melhorias')
      const data = await res.json()
      const list = Array.isArray(data) ? data : Array.isArray(data?.melhorias) ? data.melhorias : []
      setNotes(list)
    } catch {
      if (!silent) toast.error('Erro ao carregar anotações do banco.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMelhorias(false)

    const supabase = createClient()
    const channel = supabase
      .channel('superadmin-melhorias-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'melhorias' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row: any = payload.new
            if (row && row.id) {
              setNotes((prev) => {
                if (prev.some((n) => n.id === row.id)) return prev
                return [row as ErpMelhoria, ...prev]
              })
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id
            if (oldId) {
              setNotes((prev) => prev.filter((n) => n.id !== oldId))
            } else {
              loadMelhorias(true)
            }
          } else if (payload.eventType === 'UPDATE') {
            const row: any = payload.new
            if (row && row.id) {
              setNotes((prev) =>
                prev.map((n) => (n.id === row.id ? (row as ErpMelhoria) : n))
              )
            }
          }
        }
      )
      .subscribe()

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadMelhorias(true)
      }
    }

    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
    }
  }, [loadMelhorias])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    const currentTitle = title.trim()
    const currentDescription = description.trim()
    const currentCategory = category
    const categoryLabel = categoryConfig[currentCategory].label

    setIsSubmitting(true)
    setFallbackWhatsappUrl(null)

    const whatsappMessage = `[Ticket - ${categoryLabel}]\nTítulo: ${currentTitle}\nDescrição: ${currentDescription || 'Sem descrição informada'}`
    const whatsappUrl = `https://wa.me/5511993270543?text=${encodeURIComponent(whatsappMessage)}`

    try {
      // 1. Salva no Supabase na tabela melhorias
      const dbRes = await fetch('/api/admin/melhorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: currentCategory,
          titulo: currentTitle,
          descricao: currentDescription || null,
        }),
      })
      const dbData = await dbRes.json()
      if (!dbRes.ok) {
        throw new Error(dbData.error || 'Erro ao salvar anotação no banco.')
      }

      const createdItem = dbData.melhoria || dbData
      if (createdItem?.id) {
        setNotes((prev) => {
          if (prev.some((n) => n.id === createdItem.id)) return prev
          return [createdItem, ...prev]
        })
      }

      setTitle('')
      setDescription('')
      setCategory('feature')

      // 2. Envia notificação por e-mail via Resend (/api/send-ticket)
      const emailRes = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: categoryLabel,
          titulo: currentTitle,
          descricao: currentDescription,
        }),
      })

      if (!emailRes.ok) {
        const errData = await emailRes.json().catch(() => ({}))
        toast.warning(errData.error || 'Salvo no banco, mas houve falha no disparo de e-mail.')
        setFallbackWhatsappUrl(whatsappUrl)
        return
      }

      toast.success('Anotação salva no Supabase e ticket enviado por e-mail!')

      // 3. Abre WhatsApp automaticamente se o navegador estiver em primeiro plano
      const isForeground =
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        document.hasFocus()

      if (isForeground) {
        const popup = window.open(whatsappUrl, '_blank')
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setFallbackWhatsappUrl(whatsappUrl)
          toast.info('Janela automática bloqueada. Clique em "Abrir WhatsApp" abaixo.')
        }
      } else {
        setFallbackWhatsappUrl(whatsappUrl)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar anotação.')
      setFallbackWhatsappUrl(whatsappUrl)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)

    try {
      const supabase = createClient()

      // 1. Executa DELETE real na tabela melhorias do Supabase
      let success = false
      const { error: sbError } = await supabase
        .from('melhorias')
        .delete()
        .eq('id', id)

      if (!sbError) {
        success = true
      } else {
        console.warn('DELETE direto retornou erro, tentando fallback da API:', sbError)
        // Fallback para API route que usa service role
        const res = await fetch(`/api/admin/melhorias?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          success = true
        } else {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || sbError.message || 'Falha ao excluir no banco de dados')
        }
      }

      if (success) {
        // Só atualiza o state local depois de confirmar que o delete no banco teve sucesso!
        setNotes((prev) => prev.filter((n) => n.id !== id))
        toast.success('Anotação removida com sucesso.')
      }
    } catch (err: any) {
      console.error('Erro ao excluir anotação do banco:', err)
      toast.error(err?.message || 'Erro ao remover anotação do banco. O item foi mantido.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Melhorias &amp; Tickets da Plataforma
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sincronizado em tempo real entre celular e PC via Supabase.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadMelhorias(false)}
          disabled={loading}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          title="Recarregar anotações"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Add Note Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xs">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">Nova anotação / Ticket</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          {/* Category toggle pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const cfg = categoryConfig[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    category === cat
                      ? cn(cfg.className, 'border-transparent ring-2 ring-offset-1 ring-indigo-400/40')
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  )}
                >
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação *"
            required
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl text-sm"
          />

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição ou detalhes (opcional)"
            rows={3}
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl text-sm resize-none"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full sm:w-auto gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold h-11 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando &amp; Enviando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Adicionar anotação
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
                className="w-full sm:w-auto gap-2 rounded-xl text-sm font-semibold h-11 px-5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            Carregando anotações do Supabase...
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma anotação cadastrada</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
              Use o formulário acima para registrar tickets, melhorias ou bugs no Supabase.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const cfg = categoryConfig[note.tipo] || categoryConfig.feature
            const Icon = cfg.icon
            return (
              <div
                key={note.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex gap-4 group"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold',
                        cfg.className
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {note.titulo}
                  </p>
                  {note.descricao && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {note.descricao}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  title="Excluir anotação"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
