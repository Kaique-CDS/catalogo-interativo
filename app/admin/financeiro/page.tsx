'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Download, Filter, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ClientRecord {
  id: string
  name: string
  plan: string
  status: string
  mrr: number
  nextBilling?: string
  slug: string
}

export default function FinanceiroPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'paid' | 'overdue' | 'trial'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vendazap_clients')
      if (raw) setClients(JSON.parse(raw))
    } catch {}
  }, [])

  const PLAN_PRICES: Record<string, number> = {
    'Starter': 97,
    'Premium': 197,
    'Enterprise': 497,
    'Trial': 0,
  }

  // Build invoice records from clients
  const invoices = clients.map(c => ({
    id: c.id,
    client: c.name,
    slug: c.slug,
    plan: c.plan,
    value: PLAN_PRICES[c.plan] ?? 97,
    status: c.status === 'Ativo' ? 'paid' : c.status === 'Trial' ? 'trial' : 'overdue',
    date: c.nextBilling || new Date().toLocaleDateString('pt-BR'),
  }))

  const mrr = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.value, 0)
  const overdue = invoices.filter(i => i.status === 'overdue')
  const trials = invoices.filter(i => i.status === 'trial')
  const overdueValue = overdue.reduce((acc, i) => acc + i.value, 0)

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'all' || inv.status === filter
    const matchSearch = inv.client.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusStyle: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    overdue: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    trial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  }
  const statusLabel: Record<string, string> = { paid: 'Pago', overdue: 'Em Atraso', trial: 'Trial' }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Financeiro</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Receitas, cobranças e status de pagamentos.</p>
        </div>
        <Button variant="outline" className="gap-2 text-xs rounded-xl dark:border-zinc-700 dark:text-zinc-300 w-full sm:w-auto">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'MRR Atual', value: `R$ ${mrr.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', sub: 'Receita mensal recorrente' },
          { label: 'Pagamentos OK', value: invoices.filter(i=>i.status==='paid').length, icon: CheckCircle2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', sub: 'Assinantes adimplentes' },
          { label: 'Em Atraso', value: overdue.length, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', sub: `R$ ${overdueValue.toLocaleString('pt-BR')} a cobrar` },
          { label: 'Em Trial', value: trials.length, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', sub: 'Possíveis conversões' },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <div className={`h-8 w-8 rounded-lg ${k.bg} ${k.color} flex items-center justify-center mb-3`}>
              <k.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{k.value}</p>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 h-10"
        />
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {(['all','paid','overdue','trial'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter === f
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : f === 'overdue' ? 'Em Atraso' : 'Trial'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3 text-right">Valor/mês</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-xs text-zinc-400">Nenhum resultado encontrado.</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{inv.client}</p>
                    <p className="text-[10px] text-zinc-400">/{inv.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300 font-medium">{inv.plan}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">R$ {inv.value.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[inv.status]}`}>
                      {statusLabel[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-500 dark:text-zinc-400">{inv.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
