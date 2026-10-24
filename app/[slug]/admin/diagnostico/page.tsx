'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Wrench,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EnvVar {
  key: string
  label: string
  category: string
  present: boolean
}

interface MigrationItem {
  number: string
  title: string
  file: string
  applied: boolean
  description: string
  error?: string | null
  sql?: string
}

interface DiagnosticResponse {
  timestamp: string
  summary: {
    env_ok: boolean
    env_present_count: number
    env_total_count: number
    supabase_ok: boolean
    cloudinary_ok: boolean
    migrations_ok: boolean
    migrations_applied_count: number
    migrations_total_count: number
  }
  connections: {
    supabase: {
      ok: boolean
      latency_ms: number
      error: string | null
    }
    cloudinary: {
      ok: boolean
      configured: boolean
      latency_ms: number
      error: string | null
    }
  }
  env: EnvVar[]
  migrations: MigrationItem[]
}

export default function DiagnosticoPage({
  params,
}: {
  params?: Promise<{ slug: string }>
}) {
  const urlParams = useParams()
  const [slug, setSlug] = useState<string>(() => {
    if (typeof urlParams?.slug === 'string') return urlParams.slug
    return ''
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DiagnosticResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [expandedSql, setExpandedSql] = useState<string | null>(null)
  const [migrationFilter, setMigrationFilter] = useState<'all' | 'pending' | 'applied'>('all')

  useEffect(() => {
    if (params) {
      params.then((p) => {
        if (p?.slug) setSlug(p.slug)
      })
    }
  }, [params])

  const fetchDiagnostic = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const q = slug ? `?slug=${encodeURIComponent(slug)}` : ''
      const res = await fetch(`/api/admin/diagnostico${q}`, {
        cache: 'no-store',
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `Erro HTTP ${res.status}`)
      }

      const json = await res.json()
      setData(json)
      if (isManual) {
        toast.success('Diagnóstico atualizado com sucesso!')
      }
    } catch (e: any) {
      console.error('Falha ao buscar diagnóstico:', e)
      setError(e.message || 'Erro ao comunicar com a API de diagnóstico')
      if (isManual) {
        toast.error('Falha ao atualizar diagnóstico')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDiagnostic()
  }, [slug])

  const handleCopySql = async (file: string, sql?: string) => {
    if (!sql) {
      toast.error('Código SQL não disponível para esta migration.')
      return
    }
    try {
      await navigator.clipboard.writeText(sql)
      setCopiedFile(file)
      toast.success(`SQL da migration ${file} copiado para a área de transferência!`)
      setTimeout(() => setCopiedFile(null), 3000)
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione e copie manualmente.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-brand animate-spin" />
        <p className="text-sm font-semibold text-foreground">Executando diagnóstico do sistema...</p>
        <p className="text-xs text-muted-foreground">Verificando Supabase, Cloudinary e variáveis de ambiente.</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <h2 className="text-base font-bold">Falha ao Carregar Diagnóstico</h2>
          </div>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button
            size="sm"
            onClick={() => fetchDiagnostic(true)}
            className="rounded-xl gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw className="h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  const { summary, connections, env, migrations } = data
  const pendingMigrations = migrations.filter((m) => !m.applied)
  const appliedMigrations = migrations.filter((m) => m.applied)

  const displayedMigrations =
    migrationFilter === 'pending'
      ? pendingMigrations
      : migrationFilter === 'applied'
      ? appliedMigrations
      : migrations

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* 1. Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Diagnóstico do Sistema &amp; Banco
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verificação da integridade de variáveis, serviços externos e migrations do Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDiagnostic(true)}
            disabled={refreshing}
            className="rounded-xl text-xs gap-2 border-surface bg-surface-1 hover:bg-surface-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar Diagnóstico'}
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards de Visão Geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Variáveis */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Variáveis de Ambiente</span>
            <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center">
              <KeyRound className="h-3.5 w-3.5 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {summary.env_present_count}
            <span className="text-sm font-normal text-muted-foreground">/{summary.env_total_count}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {summary.env_ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Todas Presentes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> {summary.env_total_count - summary.env_present_count} Ausente(s)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Supabase */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Conexão Supabase</span>
            <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center">
              <Database className="h-3.5 w-3.5 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {connections.supabase.ok ? 'Online' : 'Falha'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {connections.supabase.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {connections.supabase.latency_ms} ms de latência
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <XCircle className="h-3 w-3" /> Erro de Conexão
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Cloudinary */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Conexão Cloudinary</span>
            <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center">
              <Cloud className="h-3.5 w-3.5 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {connections.cloudinary.ok ? 'Online' : connections.cloudinary.configured ? 'Erro' : 'Ausente'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {connections.cloudinary.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {connections.cloudinary.latency_ms} ms (Ping OK)
              </span>
            ) : connections.cloudinary.configured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <XCircle className="h-3 w-3" /> Erro na API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Falta Chaves Vercel
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Migrations */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Migrations Supabase</span>
            <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {summary.migrations_applied_count}
            <span className="text-sm font-normal text-muted-foreground">/{summary.migrations_total_count}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {summary.migrations_ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> 100% Atualizado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" /> {pendingMigrations.length} Pendente(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Seção Conexões Ativas e Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase Box */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Supabase PostgreSQL</h3>
                <p className="text-[11px] text-muted-foreground">Banco de dados principal e RLS</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                connections.supabase.ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {connections.supabase.ok ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latência de Consulta:</span>
              <span className="font-semibold text-foreground">{connections.supabase.latency_ms} ms</span>
            </div>
            {connections.supabase.error && (
              <div className="pt-2 border-t border-surface text-destructive">
                <span className="font-bold">Detalhe do erro:</span> {connections.supabase.error}
              </div>
            )}
          </div>
        </div>

        {/* Cloudinary Box */}
        <div className="bg-surface-1 border border-surface rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  connections.cloudinary.ok
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Cloudinary Media CDN</h3>
                <p className="text-[11px] text-muted-foreground">Upload de fotos de carros e banners</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                connections.cloudinary.ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : connections.cloudinary.configured
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {connections.cloudinary.ok
                ? 'OPERACIONAL'
                : connections.cloudinary.configured
                ? 'ERRO'
                : 'PENDENTE'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2 text-xs space-y-1.5">
            {connections.cloudinary.ok ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ping da API Admin:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {connections.cloudinary.latency_ms} ms (OK)
                </span>
              </div>
            ) : (
              <div className="space-y-1 text-muted-foreground">
                <p className="text-amber-600 dark:text-amber-400 font-semibold">
                  {connections.cloudinary.error ||
                    'O servidor ainda não tem as chaves do Cloudinary cadastradas na Vercel.'}
                </p>
                <p className="text-[11px]">
                  Para ativar o upload na produção, cadastre <code>CLOUDINARY_CLOUD_NAME</code>,{' '}
                  <code>CLOUDINARY_API_KEY</code> e <code>CLOUDINARY_API_SECRET</code> no painel da Vercel.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Banner de Ação para Migrations Pendentes */}
      {pendingMigrations.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-300">
                Atenção: Existem {pendingMigrations.length} migration(s) pendente(s) no Supabase!
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                Quando faltam tabelas ou colunas (como a coluna <code>status</code> da migration 022 ou{' '}
                <code>tenant_banners</code> da 023), funcionalidades como a vitrine e a gestão de banners podem
                operar em modo de contingência.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-1/90 border border-amber-500/20 text-xs text-foreground space-y-2">
            <p className="font-bold text-foreground">Como rodar no Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed">
              <li>Abra o painel do Supabase do seu projeto.</li>
              <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong> &gt; <strong>New query</strong>.</li>
              <li>Clique no botão <strong>Copiar SQL</strong> ao lado de cada migration pendente abaixo.</li>
              <li>Cole no editor do Supabase e clique no botão verde <strong>Run</strong>.</li>
              <li>Retorne a esta página e clique em <strong>Atualizar Diagnóstico</strong> acima.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 5. Tabela de Migrations do Banco (014 a 028) */}
      <div className="bg-surface-1 border border-surface rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand" /> Migrations do Supabase (014 a 028)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lista de tabelas, colunas e triggers essenciais para vitrine, estoque, banners e contratos.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setMigrationFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                migrationFilter === 'all'
                  ? 'bg-surface-1 text-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas ({migrations.length})
            </button>
            <button
              onClick={() => setMigrationFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                migrationFilter === 'pending'
                  ? 'bg-surface-1 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pendentes ({pendingMigrations.length})
            </button>
            <button
              onClick={() => setMigrationFilter('applied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                migrationFilter === 'applied'
                  ? 'bg-surface-1 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Aplicadas ({appliedMigrations.length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-surface">
          {displayedMigrations.map((m) => {
            const isExpanded = expandedSql === m.file
            const isCopied = copiedFile === m.file

            return (
              <div
                key={m.number}
                className={`p-4 transition-colors ${
                  !m.applied ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-surface-2/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded-md bg-surface-2 border border-surface">
                        {m.number}
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate">{m.title}</h4>
                      {m.applied ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Aplicada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> Pendente no Banco
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/80">Arquivo: {m.file}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopySql(m.file, m.sql)}
                      className={`h-8 px-2.5 rounded-xl text-xs gap-1.5 font-semibold ${
                        !m.applied
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                          : 'border-surface bg-surface-1 hover:bg-surface-2 text-foreground'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar SQL</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedSql(isExpanded ? null : m.file)}
                      className="h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Código SQL ({m.file})
                      </span>
                      <button
                        onClick={() => handleCopySql(m.file, m.sql)}
                        className="text-[11px] text-brand hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Copy className="h-3 w-3" /> Copiar este bloco
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-zinc-800">
                      <code>{m.sql || '-- Arquivo de migration não encontrado no disco local.'}</code>
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. Tabela de Variáveis de Ambiente */}
      <div className="bg-surface-1 border border-surface rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand" /> Variáveis de Ambiente do Sistema
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Validação de configuração na Vercel e ambiente local.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Valores protegidos por segurança</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-2/60 border-b border-surface text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-brand shrink-0" />
          <span>
            Apenas o status de presença (✅/❌) é verificado. Nenhum token, senha ou chave secreta é exposto ou
            transmitido para a interface.
          </span>
        </div>

        <div className="divide-y divide-surface">
          {env.map((e) => (
            <div
              key={e.key}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-2/30 transition-colors"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-foreground">{e.key}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted-foreground">
                    {e.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{e.label}</p>
              </div>

              <div className="shrink-0">
                {e.present ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Presente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="h-3.5 w-3.5" /> Ausente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
