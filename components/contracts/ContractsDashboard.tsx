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
  Copy,
  Check,
  Share2,
  MessageCircle,
  Upload,
  X,
  ShieldCheck,
  UserCheck,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'
import { formatCurrency, maskPhone } from '@/lib/contracts/utils'

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
  signed_pdf_url?: string
  pdf_sha256?: string
  is_manual_signed?: boolean
  manual_signed_file_url?: string
  manual_signed_by?: string
  manual_signed_at?: string
  signers?: any[]
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

  // Modal de Assinaturas e Envio
  const [shareModalContract, setShareModalContract] = useState<ContractItem | null>(null)
  const [signersLoading, setSignersLoading] = useState(false)
  const [signersData, setSignersData] = useState<{
    signers: any[]
    tokens?: { buyerSigningUrl: string; sellerSigningUrl: string }
  } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Modal de Assinatura Presencial (Física)
  const [manualModalContract, setManualModalContract] = useState<ContractItem | null>(null)
  const [manualSignedBy, setManualSignedBy] = useState(store.contract_rep_nome || store.name || '')
  const [manualNotes, setManualNotes] = useState('')
  const [manualFile, setManualFile] = useState<File | null>(null)
  const [manualSubmitting, setManualSubmitting] = useState(false)

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

  // -------------------------------------------------------------
  // MODAL DE ASSINATURAS E COMPARTILHAMENTO
  // -------------------------------------------------------------
  const handleOpenShareModal = async (c: ContractItem) => {
    setShareModalContract(c)
    setSignersLoading(true)
    setSignersData(null)
    setCopiedUrl(false)

    try {
      const res = await fetch(`/api/contracts/${c.id}/signers`)
      const data = await res.json()
      if (data.success) {
        setSignersData({
          signers: data.signers || [],
          tokens: data.tokens,
        })
      }
    } catch {
      toast.error('Erro ao carregar signatários.')
    } finally {
      setSignersLoading(false)
    }
  }

  const getBuyerSigningUrl = () => {
    if (!shareModalContract) return ''
    if (signersData?.tokens?.buyerSigningUrl) {
      return signersData.tokens.buyerSigningUrl
    }
    // Se o signatário do comprador tiver token salvo
    const buyerSigner = signersData?.signers?.find((s) => s.role === 'buyer')
    if (buyerSigner?.token_hash) {
      // Como guardamos o hash, podemos usar a URL direta se já gerada
      return typeof window !== 'undefined'
        ? `${window.location.origin}/assinar/${buyerSigner.id}`
        : ''
    }
    return ''
  }

  const handleCopyLink = (url: string) => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    toast.success('Link copiado para a área de transferência!')
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  const handleSendWhatsApp = (c: ContractItem, signingUrl: string) => {
    const rawPhone = c.buyer_data?.phone ? c.buyer_data.phone.replace(/\D/g, '') : ''
    const buyerName = c.buyer_data?.name || 'Cliente'
    const vehicleName = `${c.vehicle_data?.brand || ''} ${c.vehicle_data?.model || ''}`.trim()

    const text = encodeURIComponent(
      `Olá, *${buyerName}*! Segue o link para assinar eletronicamente o seu Contrato de Compra e Venda Nº ${c.number} (${vehicleName}) com a *${store.name}*:\n\n${signingUrl}\n\nAcesse pelo celular para assinar com segurança.`
    )

    const whatsappUrl = rawPhone
      ? `https://wa.me/55${rawPhone}?text=${text}`
      : `https://wa.me/?text=${text}`

    window.open(whatsappUrl, '_blank')
  }

  // -------------------------------------------------------------
  // REGISTRO DE ASSINATURA PRESENCIAL
  // -------------------------------------------------------------
  const handleOpenManualModal = (c: ContractItem) => {
    setManualModalContract(c)
    setManualFile(null)
    setManualSignedBy(store.contract_rep_nome || store.name || '')
    setManualNotes('')
  }

  const handleManualSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualModalContract) return

    if (!manualSignedBy.trim()) {
      toast.error('Informe o nome do responsável pela assinatura.')
      return
    }

    setManualSubmitting(true)
    const toastId = toast.loading('Registrando assinatura presencial...')

    try {
      const formData = new FormData()
      if (manualFile) {
        formData.append('file', manualFile)
      }
      formData.append('signed_by', manualSignedBy.trim())
      formData.append('notes', manualNotes.trim())
      formData.append('slug', slug)

      const res = await fetch(`/api/contracts/${manualModalContract.id}/manual-sign`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao registrar assinatura presencial.')
      }

      toast.success('Contrato marcado como assinado presencialmente! 🎉', { id: toastId })
      setManualModalContract(null)
      if (shareModalContract?.id === manualModalContract.id) {
        setShareModalContract(null)
      }
      fetchContracts()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao registrar.', { id: toastId })
    } finally {
      setManualSubmitting(false)
    }
  }

  // Estatísticas
  const totalCount = contracts.length
  const signedCount = contracts.filter((c) => c.status === 'assinado').length
  const pendingCount = contracts.filter(
    (c) => c.status === 'enviado' || c.status === 'parcialmente_assinado'
  ).length
  const draftCount = contracts.filter((c) => c.status === 'rascunho').length

  const filtered = contracts.filter((c) => {
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const buyerName = String(c.buyer_data?.name || '').toLowerCase()
    const plate = String(c.vehicle_data?.plate || '').toLowerCase()
    const model = String(c.vehicle_data?.model || '').toLowerCase()
    return buyerName.includes(term) || plate.includes(term) || model.includes(term)
  })

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER DA PÁGINA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Módulo de Contratos
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              Fase 4
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geração de contratos de venda, leitura de CRLV, assinatura online e presencial.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/${slug}/admin/configuracoes`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs rounded-xl border-surface hover:bg-surface-2"
            >
              <Settings className="h-3.5 w-3.5" />
              Configurar Loja
            </Button>
          </Link>

          <Link href={`/${slug}/admin/contratos/novo`}>
            <Button
              size="sm"
              className="btn-brand text-xs font-bold rounded-xl gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Novo Contrato de Venda
            </Button>
          </Link>
        </div>
      </div>

      {/* ── ALERTA DE CONFIGURAÇÃO DA LOJA (se faltar dados) ── */}
      {!isConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Dados jurídicos da loja não configurados</p>
              <p className="text-muted-foreground mt-0.5">
                Preencha Razão Social, CNPJ e representante em Configurações para preencher o vendedor automaticamente nos contratos.
              </p>
            </div>
          </div>
          <Link href={`/${slug}/admin/configuracoes`}>
            <Button
              size="sm"
              variant="outline"
              className="text-xs shrink-0 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Preencher Dados Agora
            </Button>
          </Link>
        </div>
      )}

      {/* ── CARDS DE MÉTRICAS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total de Contratos',
            value: totalCount,
            sub: 'Emitidos nesta loja',
            icon: FileSignature,
            color: 'text-brand',
            bg: 'bg-brand/10',
          },
          {
            label: 'Assinados / Concluídos',
            value: signedCount,
            sub: 'Com assinatura digital/física',
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Aguardando Assinatura',
            value: pendingCount,
            sub: 'Links enviados ao cliente',
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Rascunhos',
            value: draftCount,
            sub: 'Ainda não enviados',
            icon: FileText,
            color: 'text-zinc-500',
            bg: 'bg-zinc-100 dark:bg-zinc-800',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface-1 border border-surface rounded-2xl p-4 shadow-xs space-y-1.5"
          >
            <div className={`h-8 w-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs font-semibold text-foreground">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── BARRA DE BUSCA E ABAS DE STATUS ── */}
      <div className="bg-surface-1 border border-surface rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por comprador, placa ou modelo do veículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs bg-surface-2 border-surface rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'rascunho', label: 'Rascunhos' },
              { id: 'enviado', label: 'Enviados' },
              { id: 'parcialmente_assinado', label: 'Parciais' },
              { id: 'assinado', label: 'Assinados' },
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
              const vehicleName =
                `${c.vehicle_data?.brand || ''} ${c.vehicle_data?.model || ''}`.trim() || 'Veículo'
              const plate = c.vehicle_data?.plate || 'Sem placa'
              const isSigned = c.status === 'assinado'

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
                        {c.is_manual_signed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            Presencial (Físico)
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>

                      <p className="font-bold text-sm text-foreground truncate">
                        {vehicleName}{' '}
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          ({plate})
                        </span>
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
                      {/* Botão de Assinaturas & Envio */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenShareModal(c)}
                        className={`text-xs rounded-xl h-9 gap-1.5 font-bold ${
                          isSigned
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'border-brand/40 text-brand bg-brand/5 hover:bg-brand/10'
                        }`}
                      >
                        {isSigned ? (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Ver Assinaturas
                          </>
                        ) : (
                          <>
                            <FileSignature className="h-4 w-4 text-brand" />
                            Assinar / Enviar
                          </>
                        )}
                      </Button>

                      {/* Baixar PDF */}
                      <a
                        href={
                          isSigned
                            ? `/api/contracts/${c.id}/pdf?signed=true`
                            : `/api/contracts/${c.id}/pdf?print=true`
                        }
                        target="_blank"
                        rel="noreferrer"
                        title={isSigned ? 'Ver PDF Final Assinado' : 'Baixar PDF de Impressão'}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2"
                        >
                          <Printer className="h-4 w-4" />
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

      {/* ── MODAL: ASSINATURAS & COMPARTILHAMENTO (FASE 4) ── */}
      {shareModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface-1 border border-surface rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                  <FileSignature className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Assinaturas • Contrato Nº {shareModalContract.number}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Links únicos e assinatura online ou presencial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalContract(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {signersLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <div className="h-7 w-7 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Carregando status dos signatários...</p>
                </div>
              ) : (
                <>
                  {/* Status Geral */}
                  {shareModalContract.status === 'assinado' ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-emerald-700 dark:text-emerald-300">
                          Contrato 100% Concluído e Assinado!
                        </p>
                        <p className="text-muted-foreground">
                          {shareModalContract.is_manual_signed
                            ? `Assinatura presencial registrada por ${shareModalContract.manual_signed_by}.`
                            : 'Assinado eletronicamente com trilha de auditoria e código OTP.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 text-xs text-muted-foreground">
                      Envie o link seguro para o comprador assinar eletronicamente ou realize a assinatura física presencial na loja.
                    </div>
                  )}

                  {/* Card do Comprador */}
                  <div className="rounded-xl border border-surface bg-surface-2/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-brand" />
                        <span className="text-xs font-bold text-foreground">Comprador</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-foreground">
                        {shareModalContract.buyer_data?.name}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>CPF/CNPJ: {shareModalContract.buyer_data?.cpf_cnpj}</p>
                      <p>WhatsApp: {maskPhone(shareModalContract.buyer_data?.phone || '')}</p>
                      <p>E-mail: {shareModalContract.buyer_data?.email || 'Não informado'}</p>
                    </div>

                    {/* Ações para o Comprador */}
                    {shareModalContract.status !== 'assinado' && (
                      <div className="pt-2 border-t border-surface flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(getBuyerSigningUrl())}
                          className="text-xs rounded-xl h-8 gap-1.5 flex-1 border-surface hover:bg-surface-2"
                        >
                          {copiedUrl ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" /> Link Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-brand" /> Copiar Link de Assinatura
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSendWhatsApp(shareModalContract, getBuyerSigningUrl())}
                          className="text-xs rounded-xl h-8 gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Card da Loja */}
                  <div className="rounded-xl border border-surface bg-surface-2/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-brand" />
                        <span className="text-xs font-bold text-foreground">Vendedor (Loja)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-foreground">
                        {store.contract_rep_nome || store.name}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      A loja assina pelo painel administrativo ou através do link seguro enviado aos sócios.
                    </p>
                  </div>

                  {/* Opção Presencial */}
                  <div className="rounded-xl border border-surface bg-surface-1 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Assinatura Física / Presencial
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenManualModal(shareModalContract)}
                        className="text-xs rounded-xl h-8 gap-1.5 border-surface hover:bg-surface-2"
                      >
                        <Upload className="h-3.5 w-3.5 text-brand" /> Registrar Assinatura Manual
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Imprima o contrato para assinatura em papel e anexe o documento escaneado ou foto aqui.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-surface flex items-center justify-between shrink-0">
              <a
                href={
                  shareModalContract.status === 'assinado'
                    ? `/api/contracts/${shareModalContract.id}/pdf?signed=true`
                    : `/api/contracts/${shareModalContract.id}/pdf?print=true`
                }
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-brand h-8">
                  <Printer className="h-3.5 w-3.5" />
                  {shareModalContract.status === 'assinado' ? 'Ver PDF Final Assinado' : 'Baixar PDF p/ Imprimir'}
                </Button>
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShareModalContract(null)}
                className="text-xs rounded-xl border-surface hover:bg-surface-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR ASSINATURA PRESENCIAL (FÍSICA) ── */}
      {manualModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-surface-1 border border-surface rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-foreground">
                  Registrar Assinatura Presencial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManualModalContract(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualSignSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Nome do Responsável pelo Registro *
                </Label>
                <Input
                  required
                  placeholder="Nome do gerente ou vendedor da loja"
                  value={manualSignedBy}
                  onChange={(e) => setManualSignedBy(e.target.value)}
                  className="bg-surface-2 border-surface text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Anexar Contrato Físico Assinado (PDF ou Foto)
                </Label>
                <Input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                  className="bg-surface-2 border-surface text-xs file:text-xs file:font-semibold file:bg-surface-1 file:border-0 file:rounded-lg file:mr-2 cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground">
                  O documento será arquivado de forma privada para fins probatórios.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Observações Adicionais (opcional)
                </Label>
                <Input
                  placeholder="Ex: Assinado na concessionária com firma conferida."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="bg-surface-2 border-surface text-xs h-9"
                />
              </div>

              <div className="pt-2 border-t border-surface flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualModalContract(null)}
                  className="text-xs rounded-xl border-surface hover:bg-surface-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={manualSubmitting || !manualSignedBy.trim()}
                  className="btn-brand text-xs font-bold rounded-xl gap-1.5 px-4"
                >
                  {manualSubmitting ? 'Salvando...' : 'Confirmar Assinatura Manual'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
