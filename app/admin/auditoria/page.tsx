'use client'

import { useState, useEffect } from 'react'
import { Activity, Search, LogIn, Edit3, Trash2, UserPlus, AlertTriangle, ShieldAlert, Terminal, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'

type LogType = 'Login' | 'Cadastro' | 'Edição' | 'Exclusão' | 'Erro' | 'Sistema'

interface LogEntry {
  id: string
  timestamp: string
  actor: string
  type: LogType
  description: string
  ip: string
  critical: boolean
}

const TYPE_STYLE: Record<LogType, { color: string; bg: string; icon: any }> = {
  Login:    { color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: LogIn },
  Cadastro: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: UserPlus },
  'Edição':  { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Edit3 },
  Exclusão: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', icon: Trash2 },
  Erro:     { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertTriangle },
  Sistema:  { color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800', icon: Terminal },
}

function generateLogs(clients: {name: string, slug: string}[]): LogEntry[] {
  const now = new Date()
  const entries: LogEntry[] = [
    { id:'s1', timestamp: new Date(now.getTime()-1000*60*5).toISOString(), actor:'Sistema', type:'Sistema', description:'Backup automático do banco de dados concluído.', ip:'127.0.0.1', critical:false },
    { id:'s2', timestamp: new Date(now.getTime()-1000*60*30).toISOString(), actor:'admin@vendazap.com', type:'Login', description:'Super Admin fez login no painel.', ip:'189.26.44.12', critical:false },
    { id:'s3', timestamp: new Date(now.getTime()-1000*60*60*2).toISOString(), actor:'Sistema', type:'Erro', description:'Falha ao enviar e-mail de cobrança para cliente #4812.', ip:'10.0.0.1', critical:true },
    { id:'s4', timestamp: new Date(now.getTime()-1000*60*60*5).toISOString(), actor:'admin@vendazap.com', type:'Edição', description:'Plano do cliente "AutoCenter SP" alterado para Premium.', ip:'189.26.44.12', critical:false },
  ]

  clients.forEach((c, i) => {
    entries.push({ id:`c${i}a`, timestamp: new Date(now.getTime()-1000*60*60*(i*3+1)).toISOString(), actor: c.name, type:'Login', description:`Lojista "${c.name}" acessou o painel de admin.`, ip:`187.${10+i}.${20+i}.${30+i}`, critical:false })
    if (i % 3 === 0) entries.push({ id:`c${i}b`, timestamp: new Date(now.getTime()-1000*60*60*(i*3+2)).toISOString(), actor: c.name, type:'Cadastro', description:`Novo veículo cadastrado no catálogo de "${c.name}".`, ip:`187.${10+i}.${20+i}.${30+i}`, critical:false })
    if (i % 5 === 0) entries.push({ id:`c${i}c`, timestamp: new Date(now.getTime()-1000*60*60*(i*3+3)).toISOString(), actor: c.name, type:'Exclusão', description:`Veículo excluído do catálogo de "${c.name}".`, ip:`187.${10+i}.${20+i}.${30+i}`, critical:false })
  })

  return entries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h/24)}d atrás`
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<string>('Todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vendazap_clients')
      const clients = raw ? JSON.parse(raw) : []
      setLogs(generateLogs(clients))
    } catch { setLogs(generateLogs([])) }
  }, [])

  const filters = ['Todos', 'Login', 'Cadastro', 'Edição', 'Exclusão', 'Erro', 'Sistema']
  const filtered = logs.filter(l => {
    const matchType = filter === 'Todos' || l.type === filter
    const matchSearch = l.actor.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const critical = logs.filter(l => l.critical)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Auditoria de Logs</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Histórico completo de ações e eventos da plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Eventos', value: logs.length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: Activity },
          { label: 'Logins', value: logs.filter(l=>l.type==='Login').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: LogIn },
          { label: 'Erros', value: logs.filter(l=>l.type==='Erro').length, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', icon: AlertTriangle },
          { label: 'Críticos', value: critical.length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: ShieldAlert },
        ].map((s,i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Critical Alert */}
      {critical.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-400">{critical.length} evento(s) crítico(s) detectado(s)</p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{critical[0].description}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar por ator ou descrição..." value={search} onChange={e=>setSearch(e.target.value)}
            className="pl-9 rounded-xl text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 h-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {filters.map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter===f ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">Nenhum log encontrado.</div>
          ) : filtered.map(log => {
            const s = TYPE_STYLE[log.type]
            const Icon = s.icon
            return (
              <div key={log.id} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${ log.critical ? 'bg-red-50/30 dark:bg-red-950/10' : '' }`}>
                <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{log.type}</span>
                    {log.critical && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">⚠ Crítico</span>}
                    <span className="text-[10px] text-zinc-400 font-semibold">{timeAgo(log.timestamp)}</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white mt-1 truncate">{log.actor}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{log.description}</p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0 hidden sm:block pt-1">{log.ip}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
