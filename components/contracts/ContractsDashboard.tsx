'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileSignature,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  Scale,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  FileDown,
  ExternalLink,
  Trash2,
  RefreshCw,
  Printer,
  Calendar,
  AlertCircle,
  Car,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/contracts/utils'

interface ContractItem {
  id: string
  number: number
  title: string
  type: string
  status: 'rascunho' | 'enviado' | 'parcialmente_assinado' | 'assinado' | 'cancelado'
  buyer_type: 'pf' | 'pj'
  buyer_data: any
  vehicle_data: any
  financial_data: any
  clauses: any[]
  pdf_draft_url?: string
  pdf_final_url?: string
  created_at: string
}

interface Props {
  store: Store
  slug: string
  initialContracts: ContractItem[]
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: any }
> = {
  rascunho: {
    label: 'Rascunho',
    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    icon: FileText,
  },
  enviado: {
    label: 'Enviado',
    badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    icon: Clock,
  },
  parcialmente_assinado: {
    label: 'Parcialmente Assinado',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  assinado: {
    label: 'Assinado',
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  cancelado: {
    label: 'Cancelado',
    badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
}

export default function ContractsDashboard({ store, slug, initialContracts }: Props) {
  const [contracts, setContracts] = useState<ContractItem[]>(initialContracts)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isConfigured = Boolean(
    store.contract_razao_social || store.contract_cnpj || store.contract_rep_nome
  )

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('slug', slug)
      if (statusFilter !== 'todos') params.set('status', statusFilter)
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/contracts?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao buscar contratos')
      const data = await res.json()
      setContracts(data.contracts || [])
    } catch {
      toast.error('Erro ao recarregar lista de contratos.')
    } finally {
      setLoading(false)
    }
  }, [slug, statusFilter, search])

  const handleDeleteContract = async (c: ContractItem) => {
    if (!confirm(`Deseja realmente cancelar o Contrato Nº ${c.number}?`)) return

    setDeletingId(c.id)
    try {
      const res = await fetch(`/api/contracts/${c.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao cancelar contrato.')

      toast.success(`Contrato Nº ${c.number} cancelado com sucesso.`)
      setContracts((prev) => prev.filter((item) => item.id !== c.id))
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cancelar contrato.')
    } finally {
      setDeletingId(null)
    }
  }

  // Estatísticas computadas em tempo real
  const totalCount = contracts.length
  const pendingSignatures = contracts.filter(
    (c) => c.status === 'enviado' || c.status === 'parcialmente_assinado'
  ).length
  const signedCount = contracts.filter((c) => c.status === 'assinado').length
  const draftCount = contracts.filter((c) => c.status === 'rascunho').length

  const kpis = [
    {
      label: 'Total de Contratos',
      value: String(totalCount),
      sub: 'Emitidos no catálogo',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Rascunhos / Emissão',
      value: String(draftCount),
      sub: 'Em edição ou prévia',
      icon: FileSignature,
      color: 'text-zinc-600 dark:text-zinc-400',
      bg: 'bg-surface-2',
    },
    {
      label: 'Aguardando Assinatura',
      value: String(pendingSignatures),
      sub: 'Links de assinatura enviados',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Assinados / Concluídos',
      value: String(signedCount),
      sub: 'Processos finalizados',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ]

  // Filtros aplicados localmente
  const filtered = contracts.filter((c) => {
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter
    const term = search.trim().toLowerCase()
    if (!term) return matchStatus

    const buyerName = String(c.buyer_data?.name || '').toLowerCase()
    const buyerDoc = String(c.buyer_data?.cpf_cnpj || '').toLowerCase()
    const vehiclePlate = String(c.vehicle_data?.plate || '').toLowerCase()
    const vehicleModel = String(c.vehicle_data?.model || '').toLowerCase()
    const numberStr = String(c.number)

    const matchSearch =
      buyerName.includes(term) ||
      buyerDoc.includes(term) ||
      vehiclePlate.includes(term) ||
      vehicleModel.includes(term) ||
      numberStr.includes(term)

    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ── CABEÇALHO DA PÁGINA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Contratos de Veículos & Documentos
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Módulo Ativo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Geração com numeração atômica sequencial, layout PDF profissional para impressão e preparação para assinatura online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${slug}/admin/configuracoes`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl border-surface hover:bg-surface-2 gap-1.5"
            >
              <Settings className="h-3.5 w-3.5 text-brand" /> Dados da Loja
            </Button>
          </Link>
          <Link href={`/${slug}/admin/contratos/novo`}>
            <Button className="btn-brand text-xs font-bold rounded-xl gap-1.5 shadow-md">
              <Plus className="h-4 w-4" /> Novo Contrato de Venda
            </Button>
          </Link>
        </div>
      </div>

      {/* ── AVISO DE CONFIGURAÇÃO PENDENTE (SE APLICÁVEL) ── */}
      {!isConfigured && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                Complete a qualificação da sua loja
              </p>
              <p className="text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                Preencha Razão Social, CNPJ, Foro e Responsável em Configurações para que a qualificação do vendedor seja preenchida perfeitamente em todos os PDFs.
              </p>
            </div>
          </div>
          <Link href={`/${slug}/admin/configuracoes`} className="shrink-0 w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1"
            >
              Preencher Dados <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-surface bg-surface-1 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{k.label}</span>
              <div className={`h-8 w-8 rounded-xl ${k.bg} ${k.color} flex items-center justify-center`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FILTROS E BUSCA ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por comprador, placa, modelo ou nº do contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-surface-1 border-surface text-foreground rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'rascunho', label: 'Rascunho' },
              { id: 'enviado', label: 'Enviado' },
              { id: 'assinado', label: 'Assinado' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st.id
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface-1 border border-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={fetchContracts}
              disabled={loading}
              className="h-10 w-10 border-surface bg-surface-1 rounded-xl shrink-0"
              title="Recarregar contratos"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── LISTAGEM DE CONTRATOS ── */}
      <div className="bg-surface-1 border border-surface rounded-2xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-surface-2 text-muted-foreground flex items-center justify-center mx-auto">
              <FileSignature className="h-7 w-7" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="font-bold text-sm text-foreground">Nenhum contrato encontrado</h3>
              <p className="text-xs text-muted-foreground">
                {search || statusFilter !== 'todos'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Crie seu primeiro contrato de venda com geração instantânea de PDF e numeração atômica.'}
              </p>
            </div>
            {!search && statusFilter === 'todos' && (
              <Link href={`/${slug}/admin/contratos/novo`}>
                <Button className="btn-brand text-xs font-bold rounded-xl gap-1.5 mt-2">
                  <Plus className="h-4 w-4" /> Criar Primeiro Contrato
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface">
            {filtered.map((c) => {
              const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.rascunho
              const StatusIcon = statusCfg.icon
              const totalAmount = c.financial_data?.total_amount || 0
              const buyerName = c.buyer_data?.name || 'Comprador'
              const buyerDoc = c.buyer_data?.cpf_cnpj || ''
              const vehicleName = `${c.vehicle_data?.brand || ''} ${c.vehicle_data?.model || ''}`.trim() || 'Veículo'
              const plate = c.vehicle_data?.plate || 'Sem placa'

              return (
                <div
                  key={c.id}
                  className="p-4 sm:p-5 hover:bg-surface-2/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-brand">
                          Nº {c.number}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusCfg.badge}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>

                      <p className="font-bold text-sm text-foreground truncate">
                        {vehicleName} <span className="font-mono text-xs font-semibold text-muted-foreground">({plate})</span>
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        Comprador: <strong className="text-foreground">{buyerName}</strong> ({buyerDoc})
                      </p>
                    </div>
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-surface pt-2.5 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-black text-sm text-foreground font-mono">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Baixar PDF Impressão */}
                      <a
                        href={`/api/contracts/${c.id}/pdf?print=true&download=true`}
                        target="_blank"
                        rel="noreferrer"
                        title="Baixar PDF para Impressão"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-brand hover:bg-surface-2"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </a>

                      {/* Visualizar no Navegador */}
                      <a
                        href={`/api/contracts/${c.id}/pdf?print=true`}
                        target="_blank"
                        rel="noreferrer"
                        title="Visualizar PDF"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>

                      {/* Cancelar / Excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContract(c)}
                        disabled={deletingId === c.id}
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Cancelar Contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
