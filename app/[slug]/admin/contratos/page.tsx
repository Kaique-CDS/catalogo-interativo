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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStoreContractSettings } from '@/lib/contracts/module-guard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ContratosDashboardPage({ params }: Props) {
  const { slug } = await params
  const { store } = await getStoreContractSettings(slug)

  const isConfigured = Boolean(
    store.contract_razao_social || store.contract_cnpj || store.contract_rep_nome
  )

  const kpis = [
    {
      label: 'Total de Documentos',
      value: '0',
      sub: 'Contratos e procurações',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Aguardando Assinatura',
      value: '0',
      sub: 'Links ativos enviados',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Assinados / Concluídos',
      value: '0',
      sub: 'Com certificado de evidências',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Cancelados / Expirados',
      value: '0',
      sub: 'Histórico auditado',
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Contratos & Documentos Jurídicos
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Módulo Ativo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Geração de contratos de compra e venda de veículos, procurações e coleta de assinaturas eletrônicas com validade jurídica (Lei 14.063/2020).
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
          <Button
            size="sm"
            disabled
            className="btn-brand text-xs font-bold rounded-xl gap-1.5 opacity-60 cursor-not-allowed"
            title="Disponível na Fase 2 (Wizard de Criação)"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Contrato (Fase 2)
          </Button>
        </div>
      </div>

      {/* Alerta de Configuração Prévia */}
      {!isConfigured ? (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                Configure os dados jurídicos da sua loja
              </p>
              <p className="text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                Preencha Razão Social, CNPJ, Foro e Responsável em Configurações para qualificação automática do vendedor nos contratos.
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
      ) : (
        <div className="p-4 rounded-2xl border border-surface bg-surface-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-foreground">
                Dados jurídicos configurados: {store.contract_razao_social || store.name}
              </p>
              <p className="text-muted-foreground">
                CNPJ: {store.contract_cnpj || 'Pendente'} • Foro: {store.contract_foro_cidade || 'São Paulo'} - {store.contract_foro_estado || 'SP'}
              </p>
            </div>
          </div>
          <Link href={`/${slug}/admin/configuracoes`}>
            <Button variant="ghost" size="sm" className="text-xs text-brand hover:underline h-8">
              Editar
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Empty State / Status da Fase 1 */}
      <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-surface bg-surface-1/60 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-xs">
          <FileSignature className="h-7 w-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-foreground">
            Fase 1 Concluída com Sucesso!
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A infraestrutura do módulo está pronta: migração de banco com numeração sequencial atômica, controle de acesso no servidor e formulário de configurações da loja.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground max-w-lg mx-auto text-left">
          <Sparkles className="h-4 w-4 text-brand shrink-0" />
          <span>
            <strong>Próximo passo (Fase 2):</strong> Wizard interativo em 5 etapas para geração do contrato de compra e venda de veículos com PDF personalizado compatível com a Vercel.
          </span>
        </div>
      </div>
    </div>
  )
}
