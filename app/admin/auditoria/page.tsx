'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  Search,
  LogIn,
  Edit3,
  Trash2,
  UserPlus,
  AlertTriangle,
  ShieldAlert,
  Terminal,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ErpLogAuditoria, LogTipo } from '@/lib/supabase/erp-db'

const TYPE_STYLE: Record<LogTipo, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  login: {
    label: 'Login',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: LogIn,
  },
  cadastro: {
    label: 'Cadastro',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: UserPlus,
  },
  edicao: {
    label: 'Edição',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: Edit3,
  },
  exclusao: {
    label: 'Exclusão',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: Trash2,
  },
  erro: {
    label: 'Erro',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: AlertTriangle,
  },
  sistema: {
    label: 'Sistema',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    icon: Terminal,
  },
}

const FILTER_OPTIONS: { key: 'todos' | LogTipo; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'login', label: 'Login' },
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'edicao', label: 'Edição' },
  { key: 'exclusao', label: 'Exclusão' },
  { key: 'erro', label: 'Erro' },
  { key: 'sistema', label: 'Sistema' },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<ErpLogAuditoria[]>([])
  const [stats, setStats] = useState({ total: 0, logins: 0, erros: 0, criticos: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | LogTipo>('todos')
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'todos') params.set('tipo', filter)
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/admin/logs?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao buscar logs')
      const data = await res.json()
      setLogs(data.logs || [])
      if (data.stats) setStats(data.stats)
    } catch {
      toast.error('Erro ao carregar logs de auditoria.')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLogs()
    }, 200)
    return () => clearTimeout(t)
  }, [fetchLogs])

  const criticalInView = logs.filter((l) => l.criticidade === 'critico')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Auditoria de Logs</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Histórico real de ações e eventos registrados na tabela logs_auditoria.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchLogs}
          disabled={loading}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          title="Atualizar logs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total de Eventos',
            value: stats.total,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
            icon: Activity,
          },
          {
            label: 'Logins',
            value: stats.logins,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            icon: LogIn,
          },
          {
            label: 'Erros',
            value: stats.erros,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
            icon: AlertTriangle,
          },
          {
            label: 'Críticos',
            value: stats.criticos,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-950/30',
            icon: ShieldAlert,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs"
          >
            <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Critical Alert */}
      {criticalInView.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-400">
              {criticalInView.length} evento(s) crítico(s) registrado(s)
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{criticalInView[0].descricao}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por ator ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white h-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter === f.key
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum evento real encontrado para este filtro.
            </div>
          ) : (
            logs.map((log) => {
              const s = TYPE_STYLE[log.tipo] || TYPE_STYLE.sistema
              const Icon = s.icon
              const isCritical = log.criticidade === 'critico'
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    isCritical ? 'bg-red-50/30 dark:bg-red-950/10' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          ⚠ Crítico
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-semibold">{timeAgo(log.created_at)}</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mt-1 truncate">
                      {log.ator || 'Sistema'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{log.descricao}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0 hidden sm:block pt-1">
                    {log.ip || '127.0.0.1'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
