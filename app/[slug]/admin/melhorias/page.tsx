'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Lightbulb, Plus, Trash2, AlertCircle, Wrench, Zap, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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
  { label: string; className: string; icon: React.ElementType }
> = {
  Urgente:  { label: 'Urgente',  className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',   icon: AlertCircle },
  Melhoria: { label: 'Melhoria', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400', icon: Wrench },
  Ideia:    { label: 'Ideia',    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',  icon: Lightbulb },
  Bug:      { label: 'Bug',      className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',         icon: Bug },
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Note['category']>('Melhoria')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (!slug) return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setNotes(JSON.parse(stored))
    } catch {
      setNotes([])
    }
  }, [slug, storageKey])

  const persist = (updated: Note[]) => {
    setNotes(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      createdAt: new Date().toISOString(),
    }
    persist([newNote, ...notes])
    setTitle('')
    setDescription('')
    setCategory('Melhoria')
    setIsSubmitting(false)
  }

  const handleDelete = (id: string) => {
    persist(notes.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Melhorias &amp; Anotações Internas
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Registre pendências, ideias e atualizações do seu catálogo.
        </p>
      </div>

      {/* Add Note Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xs">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">Nova anotação</h2>
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
                      ? cn(cfg.className, 'border-transparent ring-2 ring-offset-1 ring-zinc-400/40')
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
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
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
          />

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição ou detalhes (opcional)"
            rows={3}
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl text-sm resize-none"
          />

          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full sm:w-auto gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Adicionar anotação
          </Button>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma anotação ainda</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
              Use o formulário acima para registrar ideias, melhorias ou pendências do seu catálogo.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const cfg = categoryConfig[note.category]
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
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {note.title}
                  </p>
                  {note.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {note.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(note.id)}
                  className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
