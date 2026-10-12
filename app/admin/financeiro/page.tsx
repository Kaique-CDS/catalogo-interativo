'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { ErpFatura, FaturaStatus } from '@/lib/supabase/erp-db'

export default function FinanceiroPage() {
  const [allFaturas, setAllFaturas] = useState<ErpFatura[]>([])
  const [filteredFaturas, setFilteredFaturas] = useState<ErpFatura[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | FaturaStatus>('todos')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadFaturas = useCallback(async () => {
    setLoading(true)
    try {
      // Carrega todas para os KPIs do topo e aplica filtro real via API
      const params = new URLSearchParams()
      if (filter !== 'todos') params.set('status', filter)
      if (search.trim()) params.set('q', search.trim())

      const [allRes, filteredRes] = await Promise.all([
        fetch('/api/admin/faturas', { cache: 'no-store' }),
        fetch(`/api/admin/faturas?${params.toString()}`, { cache: 'no-store' }),
      ])

      if (!allRes.ok || !filteredRes.ok) throw new Error('Falha ao carregar faturas')

      const allJson = await allRes.json()
      const filteredJson = await filteredRes.json()

      setAllFaturas(allJson.faturas || [])
      setFilteredFaturas(filteredJson.faturas || [])
    } catch {
      toast.error('Erro ao carregar faturas do Supabase.')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(() => {
      loadFaturas()
    }, 200)
    return () => clearTimeout(t)
  }, [loadFaturas])

  const handleStatusChange = async (faturaId: string, newStatus: FaturaStatus) => {
    setUpdatingId(faturaId)
    try {
      const res = await fetch('/api/admin/faturas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faturaId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar fatura')
      toast.success(`Status da fatura atualizado para ${newStatus.toUpperCase()}!`)
      loadFaturas()
    } catch {
      toast.error('Falha ao atualizar status da fatura.')
    } finally {
      setUpdatingId(null)
    }
  }

  // KPIs calculados a partir das faturas reais
  const pagas = allFaturas.filter((f) => f.status === 'pago')
  const atrasadas = allFaturas.filter((f) => f.status === 'atrasado')
  const trials = allFaturas.filter((f) => f.status === 'trial')

  const mrrAtual = pagas.reduce((acc, f) => acc + Number(f.valor || 0), 0)
  const valorAtrasado = atrasadas.reduce((acc, f) => acc + Number(f.valor || 0), 0)

  const handleExportCsv = () => {
    if (filteredFaturas.length === 0) {
      toast.error('Não há faturas filtradas para exportar.')
      return
    }
    const headers = ['ID Fatura', 'Loja / Cliente', 'E-mail', 'Plano', 'Valor (R$)', 'Status', 'Vencimento', 'Pago Em']
    const rows = filteredFaturas.map((f) => [
      f.id,
      f.clientes?.nome_loja || 'Cliente',
      f.clientes?.email || '',
      f.clientes?.plano || '',
      Number(f.valor || 0).toFixed(2),
      f.status,
      f.vencimento,
      f.pago_em ? new Date(f.pago_em).toLocaleDateString('pt-BR') : '',
    ])

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `faturas-${filter}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('CSV de faturas exportado com sucesso!')
  }

  const statusStyle: Record<FaturaStatus, string> = {
    pago: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    atrasado: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    pendente: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
    trial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  }

  const statusLabel: Record<FaturaStatus, string> = {
    pago: 'Pago',
    atrasado: 'Em Atraso',
    pendente: 'Pendente',
    trial: 'Trial',
  }

  const tabs: { key: 'todos' | FaturaStatus; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pago', label: 'Pagos' },
    { key: 'atrasado', label: 'Em Atraso' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'trial', label: 'Trial' },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Financeiro</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Receitas reais, faturas vencidas marcadas automaticamente e controle de pagamentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadFaturas}
            disabled={loading}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
            title="Atualizar faturas"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="gap-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 w-full sm:w-auto"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'MRR Atual',
            value: `R$ ${mrrAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            sub: 'Soma de faturas pagas',
          },
          {
            label: 'Pagamentos OK',
            value: pagas.length,
            icon: CheckCircle2,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
            sub: 'Faturas quitadas',
          },
          {
            label: 'Em Atraso',
            value: atrasadas.length,
            icon: AlertCircle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
            sub: `R$ ${valorAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`,
          },
          {
            label: 'Em Trial',
            value: trials.length,
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            sub: 'Período de avaliação',
          },
        ].map((k, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs"
          >
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nome da loja ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white h-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter === t.key
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {t.label}
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
                <th className="px-4 py-3">Loja / Cliente</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Vencimento</th>
                <th className="px-4 py-3 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-zinc-400">
                    Carregando faturas...
                  </td>
                </tr>
              ) : filteredFaturas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-zinc-400">
                    Nenhuma fatura encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filteredFaturas.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                        {inv.clientes?.nome_loja || 'Loja'}
                      </p>
                      <p className="text-[11px] text-zinc-400">{inv.clientes?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300 font-bold uppercase">
                      {inv.clientes?.plano || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">
                      R$ {Number(inv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          statusStyle[inv.status] || statusStyle.pendente
                        }`}
                      >
                        {statusLabel[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {inv.vencimento
                        ? new Date(inv.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        disabled={updatingId === inv.id}
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value as FaturaStatus)}
                        className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none"
                      >
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                        <option value="atrasado">Em Atraso</option>
                        <option value="trial">Trial</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
