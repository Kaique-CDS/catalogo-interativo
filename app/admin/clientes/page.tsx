'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  Send,
  Plus,
  X,
  Clock,
  RefreshCw,
  FileSignature,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ErpCliente, ClientePlano, ClienteStatus } from '@/lib/supabase/erp-db'

const PLANO_LABELS: Record<ClientePlano, string> = {
  basico: 'Básico (R$ 49)',
  medio: 'Médio (R$ 99)',
  premium: 'Premium (R$ 199)',
  trial: 'Trial (Grátis)',
}

const PLANO_BADGE: Record<ClientePlano, string> = {
  basico: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  medio: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  premium: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  trial: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
}

const LIMIT_MB_BY_PLANO: Record<ClientePlano, number> = {
  basico: 1024,
  medio: 2048,
  premium: 5120,
  trial: 512,
}

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Number(mb || 0).toFixed(0)} MB`
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ErpCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [planoFilter, setPlanoFilter] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)

  // Modal Adicionar Cliente
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    nome_loja: '',
    email: '',
    cnpj: '',
    plano: 'medio' as ClientePlano,
    status: 'ativo' as ClienteStatus,
    uso_banco_mb: '120',
    data_vencimento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  })

  // Modal Editar Cliente
  const [editingClient, setEditingClient] = useState<ErpCliente | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    nome_loja: '',
    email: '',
    cnpj: '',
    plano: 'medio' as ClientePlano,
    status: 'ativo' as ClienteStatus,
    uso_banco_mb: '0',
    data_vencimento: '',
  })

  // Módulos das Lojas (Feature Flags)
  interface StoreModuleItem {
    id: string
    name: string
    slug: string
    contracts_enabled: boolean
    modules: Record<string, any> | null
  }
  const [storesModules, setStoresModules] = useState<StoreModuleItem[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setLoadingModules(true)
    try {
      const res = await fetch('/api/admin/clientes/modules', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setStoresModules(data.stores || [])
      }
    } catch (err) {
      console.error('Erro ao buscar módulos:', err)
    } finally {
      setLoadingModules(false)
    }
  }, [])

  const handleToggleModule = async (store: StoreModuleItem) => {
    const nextVal = !store.contracts_enabled
    setTogglingSlug(store.slug)
    try {
      const res = await fetch('/api/admin/clientes/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          slug: store.slug,
          contracts_enabled: nextVal,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar módulo.')
      }
      setStoresModules((prev) =>
        prev.map((s) =>
          s.id === store.id
            ? {
                ...s,
                contracts_enabled: nextVal,
                modules: { ...(s.modules || {}), contracts: nextVal },
              }
            : s
        )
      )
      toast.success(
        `Módulo de Contratos ${nextVal ? 'ATIVADO' : 'DESATIVADO'} para ${store.name || store.slug}!`
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status do módulo.')
    } finally {
      setTogglingSlug(null)
    }
  }

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.set('q', searchTerm.trim())
      if (statusFilter !== 'todos') params.set('status', statusFilter)
      if (planoFilter !== 'todos') params.set('plano', planoFilter)

      const res = await fetch(`/api/admin/clientes?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao buscar clientes')
      const data = await res.json()
      setClients(data.clientes || [])
    } catch {
      toast.error('Erro ao carregar clientes do Supabase.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, planoFilter])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients()
    }, 200)
    return () => clearTimeout(timer)
  }, [fetchClients])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.nome_loja.trim() || !createForm.email.trim() || !createForm.data_vencimento) {
      toast.error('Preencha nome da loja, e-mail e data de vencimento.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_loja: createForm.nome_loja.trim(),
          email: createForm.email.trim(),
          cnpj: createForm.cnpj.trim() || null,
          plano: createForm.plano,
          status: createForm.plano === 'trial' ? 'trial' : createForm.status,
          uso_banco_mb: Number(createForm.uso_banco_mb || 0),
          data_vencimento: createForm.data_vencimento,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao cadastrar cliente.')
        return
      }
      toast.success(`Cliente "${createForm.nome_loja}" cadastrado e 1ª fatura gerada!`)
      setShowCreateModal(false)
      setCreateForm({
        nome_loja: '',
        email: '',
        cnpj: '',
        plano: 'medio',
        status: 'ativo',
        uso_banco_mb: '120',
        data_vencimento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      })
      fetchClients()
    } catch {
      toast.error('Erro de conexão ao salvar cliente.')
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (client: ErpCliente) => {
    setEditingClient(client)
    setEditForm({
      nome_loja: client.nome_loja,
      email: client.email,
      cnpj: client.cnpj || '',
      plano: client.plano,
      status: client.status,
      uso_banco_mb: String(client.uso_banco_mb ?? 0),
      data_vencimento: client.data_vencimento?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/clientes/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_loja: editForm.nome_loja.trim(),
          email: editForm.email.trim(),
          cnpj: editForm.cnpj.trim() || null,
          plano: editForm.plano,
          status: editForm.status,
          uso_banco_mb: Number(editForm.uso_banco_mb || 0),
          data_vencimento: editForm.data_vencimento,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao atualizar cliente.')
        return
      }
      toast.success(`Dados de "${editForm.nome_loja}" atualizados com sucesso!`)
      setEditingClient(null)
      fetchClients()
    } catch {
      toast.error('Erro ao atualizar cliente.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteClient = async (client: ErpCliente) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${client.nome_loja}"? Todas as faturas associadas também serão removidas.`)) {
      return
    }
    try {
      const res = await fetch(`/api/admin/clientes/${client.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        toast.error('Erro ao excluir cliente.')
        return
      }
      toast.success(`Cliente "${client.nome_loja}" e suas faturas foram removidos.`)
      fetchClients()
    } catch {
      toast.error('Erro de conexão ao excluir cliente.')
    }
  }

  const handleCobrarWhatsApp = (client: ErpCliente) => {
    const msg = encodeURIComponent(
      `Olá, equipe da ${client.nome_loja}! Notamos que sua assinatura do plano ${client.plano.toUpperCase()} na plataforma VendaZap vence em ${new Date(client.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}. Caso precise de suporte ou segunda via, estamos à disposição!`
    )
    window.open(`https://wa.me/5511993270543?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clientes & Lojas</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie todos os assinantes reais cadastrados no Supabase.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchClients}
            disabled={loading}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
            title="Recarregar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs gap-2"
          >
            <Plus className="h-4 w-4" /> Adicionar Cliente Manual
          </Button>
        </div>
      </div>

      {/* SEÇÃO: ATIVAÇÃO DE MÓDULOS POR TENANT (EXCLUSIVO SUPER ADMIN) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Ativação de Módulos por Tenant
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ligue ou desligue o <strong>Módulo de Contratos</strong> para cada loja. Se desligado, a aba e rotas são bloqueadas no servidor.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchModules}
            disabled={loadingModules}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingModules ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>

        {storesModules.length === 0 ? (
          <p className="text-xs text-zinc-400 py-2">
            {loadingModules ? 'Carregando lojas...' : 'Nenhuma loja cadastrada na tabela stores.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storesModules.map((s) => {
              const isEnabled = s.contracts_enabled === true || (s.modules && s.modules.contracts === true)
              const isToggling = togglingSlug === s.slug

              return (
                <div
                  key={s.id || s.slug}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {s.name || s.slug}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">/{s.slug}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        Contratos: {isEnabled ? 'Ativo' : 'Desligado'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleModule(s)}
                    className="shrink-0 p-1 rounded-lg text-zinc-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    title={isEnabled ? 'Desativar Módulo de Contratos' : 'Ativar Módulo de Contratos'}
                  >
                    {isEnabled ? (
                      <ToggleRight className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toolbar: Search + Advanced Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por nome da loja, e-mail ou CNPJ (query ilike)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className={`h-11 rounded-xl border-zinc-200 dark:border-zinc-800 gap-2 ${
              showFilters || statusFilter !== 'todos' || planoFilter !== 'todos'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Filtrar por Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Filtrar por Plano</Label>
              <select
                value={planoFilter}
                onChange={(e) => setPlanoFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white outline-none"
              >
                <option value="todos">Todos os Planos</option>
                <option value="basico">Básico</option>
                <option value="medio">Médio</option>
                <option value="premium">Premium</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('todos')
                  setPlanoFilter('todos')
                  setSearchTerm('')
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome da Loja</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Uso de Banco (BD)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    Carregando clientes do banco...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    Nenhum cliente encontrado para os filtros informados.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const limitMb = LIMIT_MB_BY_PLANO[client.plano] || 1024
                  const usedMb = Number(client.uso_banco_mb || 0)
                  const pct = Math.min((usedMb / limitMb) * 100, 100)

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        client.status === 'inativo' ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 dark:text-white">{client.nome_loja}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {client.email} {client.cnpj ? `• CNPJ: ${client.cnpj}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                            PLANO_BADGE[client.plano] || PLANO_BADGE.basico
                          }`}
                        >
                          {client.plano}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {client.status === 'ativo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                          </span>
                        )}
                        {client.status === 'trial' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" /> Trial
                          </span>
                        )}
                        {client.status === 'inativo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                            <AlertCircle className="h-3.5 w-3.5" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {client.data_vencimento
                          ? new Date(client.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                            {formatMb(usedMb)}
                          </span>
                          <span className="text-zinc-400">{formatMb(limitMb)}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              pct > 80 ? 'bg-rose-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-amber-600 dark:text-zinc-400"
                            title="Notificar via WhatsApp"
                            onClick={() => handleCobrarWhatsApp(client)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400"
                            title="Editar Cliente / Plano / Status"
                            onClick={() => openEditModal(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-rose-600 dark:text-zinc-400"
                            title="Excluir Cliente"
                            onClick={() => handleDeleteClient(client)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Total listado: {clients.length} cliente(s)
          </span>
        </div>
      </div>

      {/* MODAL ADICIONAR CLIENTE MANUAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Adicionar Cliente Manual</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cria o cliente no Supabase, gera a 1ª fatura pendente e registra auditoria.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome da Loja *</Label>
                <Input
                  required
                  value={createForm.nome_loja}
                  onChange={(e) => setCreateForm({ ...createForm, nome_loja: e.target.value })}
                  placeholder="Ex: AutoPrime Seminovos"
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">E-mail *</Label>
                  <Input
                    required
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="contato@loja.com.br"
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CNPJ</Label>
                  <Input
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm({ ...createForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Plano *</Label>
                  <select
                    value={createForm.plano}
                    onChange={(e) => setCreateForm({ ...createForm, plano: e.target.value as ClientePlano })}
                    className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="basico">{PLANO_LABELS.basico}</option>
                    <option value="medio">{PLANO_LABELS.medio}</option>
                    <option value="premium">{PLANO_LABELS.premium}</option>
                    <option value="trial">{PLANO_LABELS.trial}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Data de Vencimento *</Label>
                  <Input
                    required
                    type="date"
                    value={createForm.data_vencimento}
                    onChange={(e) => setCreateForm({ ...createForm, data_vencimento: e.target.value })}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  {creating ? 'Salvando...' : 'Salvar Cliente & Gerar Fatura'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Editar Cliente</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Alterações de plano ou status geram registro automático na Auditoria de Logs.
                </p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome da Loja</Label>
                <Input
                  required
                  value={editForm.nome_loja}
                  onChange={(e) => setEditForm({ ...editForm, nome_loja: e.target.value })}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">E-mail</Label>
                  <Input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CNPJ</Label>
                  <Input
                    value={editForm.cnpj}
                    onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Plano</Label>
                  <select
                    value={editForm.plano}
                    onChange={(e) => setEditForm({ ...editForm, plano: e.target.value as ClientePlano })}
                    className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="basico">Básico</option>
                    <option value="medio">Médio</option>
                    <option value="premium">Premium</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Status</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ClienteStatus })}
                    className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Vencimento</Label>
                  <Input
                    required
                    type="date"
                    value={editForm.data_vencimento}
                    onChange={(e) => setEditForm({ ...editForm, data_vencimento: e.target.value })}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Uso do Banco (MB)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.uso_banco_mb}
                    onChange={(e) => setEditForm({ ...editForm, uso_banco_mb: e.target.value })}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingClient(null)}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
