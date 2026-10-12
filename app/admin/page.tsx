'use client'

import React, { useEffect, useState } from 'react'
import { Users, CreditCard, TrendingUp, ArrowUpRight, Activity, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ErpCliente, ErpFatura, ErpLogAuditoria } from '@/lib/supabase/erp-db'

interface DashboardData {
  mrr: number
  lojasAtivas: number
  faturasVencidas: number
  churnRate: number
  chartMonths: { month: string; pagos: number; trials: number }[]
  recentLogs: ErpLogAuditoria[]
  clientes: ErpCliente[]
  faturas: ErpFatura[]
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ontem'
  return `${days}d atrás`
}

const LOG_TYPE_META: Record<string, { title: string; color: string }> = {
  login: { title: 'Acesso no Painel', color: 'bg-indigo-500' },
  cadastro: { title: 'Novo Cadastro', color: 'bg-emerald-500' },
  edicao: { title: 'Alteração Cadastral', color: 'bg-amber-500' },
  exclusao: { title: 'Registro Excluído', color: 'bg-rose-500' },
  erro: { title: 'Alerta de Erro', color: 'bg-red-500' },
  sistema: { title: 'Evento do Sistema', color: 'bg-zinc-500' },
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar dashboard')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Erro ao carregar dados do dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleExportCsv = () => {
    if (!data) return
    const clientMap = new Map(data.clientes.map((c) => [c.id, c]))
    const headers = [
      'Cliente ID',
      'Nome da Loja',
      'E-mail',
      'CNPJ',
      'Plano',
      'Status Cliente',
      'Uso Banco (MB)',
      'Fatura ID',
      'Valor Fatura (R$)',
      'Status Fatura',
      'Vencimento Fatura',
      'Pago Em',
    ]

    const rows: string[][] = []
    if (data.faturas.length > 0) {
      for (const f of data.faturas) {
        const c = clientMap.get(f.cliente_id)
        rows.push([
          c?.id || f.cliente_id,
          c?.nome_loja || f.clientes?.nome_loja || 'Loja Removida',
          c?.email || f.clientes?.email || '',
          c?.cnpj || '',
          c?.plano || f.clientes?.plano || '',
          c?.status || '',
          String(c?.uso_banco_mb ?? 0),
          f.id,
          Number(f.valor || 0).toFixed(2),
          f.status,
          f.vencimento,
          f.pago_em || '',
        ])
      }
    } else {
      for (const c of data.clientes) {
        rows.push([
          c.id,
          c.nome_loja,
          c.email,
          c.cnpj || '',
          c.plano,
          c.status,
          String(c.uso_banco_mb ?? 0),
          '-',
          '0.00',
          '-',
          c.data_vencimento,
          '',
        ])
      }
    }

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-vendazap-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Relatório CSV exportado com sucesso!')
  }

  const mrrFormatted = `R$ ${Number(data?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const kpis = [
    {
      title: 'Receita Recorrente (MRR)',
      value: loading ? '...' : mrrFormatted,
      badge: 'Mês atual',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Lojas Ativas',
      value: loading ? '...' : String(data?.lojasAtivas ?? 0),
      badge: `${data?.clientes?.length ?? 0} total`,
      trendUp: true,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      title: 'Faturas Vencidas',
      value: loading ? '...' : String(data?.faturasVencidas ?? 0),
      badge: (data?.faturasVencidas ?? 0) === 0 ? 'Em dia' : 'Atenção',
      trendUp: (data?.faturasVencidas ?? 0) === 0,
      icon: CreditCard,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      title: 'Taxa de Churn',
      value: loading ? '...' : `${Number(data?.churnRate ?? 0).toFixed(1)}%`,
      badge: 'Inativos / Total',
      trendUp: (data?.churnRate ?? 0) <= 5,
      icon: Activity,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Master</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Visão geral do crescimento e faturamento real da plataforma no Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadDashboard}
            disabled={loading}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={loading || !data}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl gap-2"
          >
            <Download className="h-4 w-4" /> Baixar Relatório
          </Button>
          <Link href="/admin/clientes">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Gerenciar Clientes</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                kpi.trendUp
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
                  : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20'
              }`}>
                {kpi.badge} {kpi.trendUp && <ArrowUpRight className="h-3 w-3" />}
              </span>
            </div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">{kpi.title}</h3>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Real com Recharts */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Crescimento de Assinaturas (Últimos 6 Meses)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Assinantes Pagos
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Trials Ativos
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartMonths || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.2)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fafafa',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="pagos" name="Assinantes Pagos" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={38} />
                <Bar dataKey="trials" name="Trials Ativos" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividade Recente Real (logs_auditoria) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Atividade Recente</h3>
          <div className="flex-1 space-y-5">
            {loading ? (
              <p className="text-xs text-zinc-400 py-8 text-center">Carregando logs...</p>
            ) : !data?.recentLogs || data.recentLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">Nenhuma atividade registrada ainda.</p>
            ) : (
              data.recentLogs.map((log, i) => {
                const meta = LOG_TYPE_META[log.tipo] || LOG_TYPE_META.sistema
                const isLast = i === data.recentLogs.length - 1
                return (
                  <div key={log.id} className="flex gap-4 relative">
                    {!isLast && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800 -ml-[1px]"></div>
                    )}
                    <div
                      className={`w-4 h-4 rounded-full border-[3px] border-white dark:border-zinc-900 shrink-0 ${meta.color} relative z-10 mt-1`}
                    ></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {meta.title} {log.ator ? `· ${log.ator}` : ''}
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 break-words">{log.descricao}</p>
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block mt-1">
                        {formatRelativeTime(log.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <Link href="/admin/auditoria" className="mt-6">
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              Ver Todo Histórico
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
