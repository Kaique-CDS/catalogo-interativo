'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Lightbulb, Plus, Trash2, AlertCircle, Wrench, Bug, MessageCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Note {
  id: string
  title: string
  description: string
  category: 'Urgente' | 'Melhoria' | 'Ideia' | 'Bug'
  createdAt: string
}

const CATEGORIES = ['Urgente', 'Melhoria', 'Ideia', 'Bug'] as const

const categoryConfig: Record<
  Note['category'],
  { label: string; className: string; icon: React.ElementType; dbTipo: 'urgente' | 'feature' | 'analise' | 'bug' }
> = {
  Urgente:  { label: 'Urgente',  className: 'bg-surface-2 text-muted-foreground', icon: AlertCircle, dbTipo: 'urgente' },
  Melhoria: { label: 'Melhoria', className: 'bg-surface-2 text-muted-foreground', icon: Wrench, dbTipo: 'feature' },
  Ideia:    { label: 'Ideia',    className: 'bg-surface-2 text-muted-foreground', icon: Lightbulb, dbTipo: 'analise' },
  Bug:      { label: 'Bug',      className: 'bg-surface-2 text-muted-foreground', icon: Bug, dbTipo: 'bug' },
}

const dbTipoToCategory: Record<string, Note['category']> = {
  urgente: 'Urgente',
  feature: 'Melhoria',
  analise: 'Ideia',
  bug: 'Bug',
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

export default function MelhoriasPage() {
  const params = useParams()
  const slug = params?.slug as string

  const storageKey = `vendazap_notes_${slug}`

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Note['category']>('Melhoria')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fallbackWhatsappUrl, setFallbackWhatsappUrl] = useState<string | null>(null)
  const hasMigratedLocalRef = useRef(false)

  const loadNotes = useCallback(async (silent = false) => {
    if (!slug) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/admin/melhorias?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        const data = await res.json()
        const rawList = Array.isArray(data) ? data : Array.isArray(data?.melhorias) ? data.melhorias : []

        // Se este dispositivo (ex: celular) tinha anotações salvas apenas no localStorage antes da integração,
        // sincroniza automaticamente para o Supabase uma única vez para que apareçam no PC.
        if (!hasMigratedLocalRef.current) {
          hasMigratedLocalRef.current = true
          try {
            const localRaw = localStorage.getItem(storageKey)
            if (localRaw) {
              const localNotes: Note[] = JSON.parse(localRaw)
              const remoteKeys = new Set(
                rawList.map((m: any) => `${String(m.titulo || '').trim().toLowerCase()}::${String(m.descricao || '').trim().toLowerCase()}`)
              )
              const unsynced = localNotes.filter((ln) => {
                const key = `${String(ln.title || '').trim().toLowerCase()}::${String(ln.description || '').trim().toLowerCase()}`
                return ln.title && !remoteKeys.has(key)
              })
              if (unsynced.length > 0) {
                for (const ln of unsynced) {
                  const cfg = categoryConfig[ln.category] || categoryConfig.Melhoria
                  const createRes = await fetch('/api/admin/melhorias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tipo: cfg.dbTipo,
                      titulo: ln.title,
                      descricao: ln.description || null,
                    }),
                  })
                  const createdJson = await createRes.json().catch(() => ({}))
                  if (createdJson?.melhoria) {
                    rawList.unshift(createdJson.melhoria)
                  }
                }
              }
            }
          } catch {
            // ignore migration error
          }
        }

        const mapped: Note[] = rawList.map((m: any) => ({
          id: m.id,
          title: m.titulo,
          description: m.descricao || '',
          category: dbTipoToCategory[m.tipo] || 'Melhoria',
          createdAt: m.created_at,
        }))

        setNotes(mapped)
        localStorage.setItem(storageKey, JSON.stringify(mapped))
        return
      }
    } catch {
      // fallback to localStorage if offline
    } finally {
      if (!silent) setLoading(false)
    }
  }, [slug, storageKey])

  // Carrega ao abrir e mantém sincronizado em tempo real entre Celular e PC
  useEffect(() => {
    loadNotes(false)

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadNotes(true)
      }
    }, 4000)

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadNotes(true)
      }
    }

    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
    }
  }, [loadNotes])

  const persist = (updated: Note[]) => {
    setNotes(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    const currentTitle = title.trim()
    const currentDescription = description.trim()
    const currentCategory = category

    setIsSubmitting(true)
    setFallbackWhatsappUrl(null)

    setTitle('')
    setDescription('')
    setCategory('Melhoria')

    const whatsappMessage = `[Ticket - ${currentCategory}]\nTítulo: ${currentTitle}\nDescrição: ${currentDescription || 'Sem descrição informada'}`
    const whatsappUrl = `https://wa.me/5511993270543?text=${encodeURIComponent(whatsappMessage)}`

    try {
      // 1. Salva no Supabase para sincronizar entre Celular e PC
      const dbRes = await fetch('/api/admin/melhorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: categoryConfig[currentCategory].dbTipo,
          titulo: currentTitle,
          descricao: currentDescription || null,
        }),
      })
      const dbData = await dbRes.json().catch(() => ({}))
      const savedRow = dbData?.melhoria || dbData

      const newNote: Note = {
        id: savedRow?.id || crypto.randomUUID(),
        title: currentTitle,
        description: currentDescription,
        category: currentCategory,
        createdAt: savedRow?.created_at || new Date().toISOString(),
      }
      persist([newNote, ...notes])

      // Recarrega do servidor para garantir lista idêntica em todos os dispositivos
      loadNotes(true)

      // 2. Dispara o envio de e-mail via API route (/api/send-ticket)
      const res = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: currentCategory,
          titulo: currentTitle,
          descricao: currentDescription,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao enviar notificação por e-mail.')
      }

      toast.success('Anotação sincronizada na nuvem e ticket enviado por e-mail!')

      // 3. Abre o WhatsApp automaticamente após sucesso do e-mail se o navegador estiver em primeiro plano
      const isForeground =
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        document.hasFocus()

      if (isForeground) {
        const popup = window.open(whatsappUrl, '_blank')
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setFallbackWhatsappUrl(whatsappUrl)
          toast.info('O navegador bloqueou a janela automática. Clique em "Abrir WhatsApp" abaixo.')
        }
      } else {
        setFallbackWhatsappUrl(whatsappUrl)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar e-mail do ticket. A anotação foi salva na nuvem.')
      setFallbackWhatsappUrl(whatsappUrl)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    persist(notes.filter((n) => n.id !== id))
    try {
      await fetch(`/api/admin/melhorias?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      toast.success('Anotação removida.')
    } catch {
      toast.error('Erro ao remover anotação do servidor.')
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-wide">
            Melhorias &amp; Anotações Internas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre pendências, ideias e atualizações do seu catálogo (sincronizado entre celular e PC).
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadNotes(false)}
          disabled={loading}
          className="border-surface bg-surface-1 text-muted-foreground hover:text-white rounded-xl shrink-0"
          title="Sincronizar agora"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Add Note Form */}
      <div className="bg-surface-1 border border-surface rounded-xl p-4 sm:p-6 shadow-xs">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Nova anotação</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          {/* Category select */}
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
                      ? 'border-brand bg-brand text-white'
                      : 'border-surface text-muted-foreground bg-surface-2 hover:bg-surface-3'
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
            className="input-brand text-sm"
          />

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição ou detalhes (opcional)"
            rows={3}
            className="input-brand text-sm resize-none"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full sm:w-auto btn-brand gap-2 rounded-xl text-sm font-semibold h-11 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando ticket...
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
                className="w-full sm:w-auto gap-2 rounded-xl text-sm font-semibold h-11 px-5 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
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
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-1 border border-surface rounded-xl shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-brand" />
            </div>
            <p className="text-sm font-bold text-white">Nenhuma anotação ainda</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Use o formulário acima para registrar ideias, melhorias ou pendências do seu catálogo.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const cfg = categoryConfig[note.category] || categoryConfig.Melhoria
            const Icon = cfg.icon
            return (
              <div
                key={note.id}
                className="bg-surface-1 border border-surface rounded-xl p-4 sm:p-5 shadow-xs flex gap-4 group hover:bg-surface-2 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border border-surface',
                        cfg.className
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">
                    {note.title}
                  </p>
                  {note.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {note.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(note.id)}
                  className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-white hover:bg-red-500 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  title="Excluir anotação"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
