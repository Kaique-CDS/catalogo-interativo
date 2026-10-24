'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  SlidersHorizontal,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  BookmarkCheck,
  Scale,
  Eye,
  EyeOff,
  AlertTriangle,
  Car,
  Shield,
  FileCheck,
  Building2,
  FileText,
  Clock,
  ArrowRightLeft,
  Lock,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getOrdinalFeminine, stripClauseOrdinalPrefix, type ContractClause } from '@/lib/contracts/utils'
import {
  type ClauseAnswers,
  type ClauseContext,
  type ExtraClauseConfig,
  buildAllClauses,
  buildClause1_Estado,
  buildClause2_Sinal,
  buildClause3_Entrega,
  buildClause4_Debitos,
  buildClause5_Transferencia,
  buildClause6_Garantia,
  buildClause7_Foro,
} from '@/lib/contracts/clause-builders'

interface ContractClauseQuestionnaireProps {
  answers: ClauseAnswers
  onAnswersChange: (newAnswers: ClauseAnswers) => void
  clauses: ContractClause[]
  onClausesChange: (newClauses: ContractClause[]) => void
  manuallyEditedIds: string[]
  onManuallyEditedIdsChange: (ids: string[]) => void
  clauseMode: 'questionario' | 'avancado'
  onClauseModeChange: (mode: 'questionario' | 'avancado') => void
  context: ClauseContext
  onSaveTemplate: () => Promise<void>
  savingTemplate: boolean
  onRestoreDefault: () => void
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export function ContractClauseQuestionnaire({
  answers,
  onAnswersChange,
  clauses,
  onClausesChange,
  manuallyEditedIds,
  onManuallyEditedIdsChange,
  clauseMode,
  onClauseModeChange,
  context,
  onSaveTemplate,
  savingTemplate,
  onRestoreDefault,
}: ContractClauseQuestionnaireProps) {
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [pendingOverwriteClauseId, setPendingOverwriteClauseId] = useState<string | null>(null)
  const [pendingOverwriteAnswers, setPendingOverwriteAnswers] = useState<ClauseAnswers | null>(null)

  // Atualiza respostas do questionário com sincronização inteligente das cláusulas
  const updateAnswers = (updater: (prev: ClauseAnswers) => ClauseAnswers, targetClauseId?: string) => {
    const nextAnswers = updater(answers)

    // Se a cláusula alvo foi editada manualmente, pede confirmação antes de sobrescrever
    if (targetClauseId && manuallyEditedIds.includes(targetClauseId)) {
      setPendingOverwriteClauseId(targetClauseId)
      setPendingOverwriteAnswers(nextAnswers)
      return
    }

    applyAnswersUpdate(nextAnswers)
  }

  const applyAnswersUpdate = (nextAnswers: ClauseAnswers) => {
    onAnswersChange(nextAnswers)
    const regenerated = buildAllClauses(nextAnswers, context)

    // Preserva títulos e textos das cláusulas marcadas como editadas manualmente
    const merged = regenerated.map((rc) => {
      if (manuallyEditedIds.includes(rc.id)) {
        const existing = clauses.find((c) => c.id === rc.id)
        if (existing) {
          return { ...rc, title: existing.title, text: existing.text }
        }
      }
      return rc
    })

    onClausesChange(merged)
  }

  const confirmOverwrite = () => {
    if (pendingOverwriteClauseId && pendingOverwriteAnswers) {
      // Remove do rastreio de edições manuais
      onManuallyEditedIdsChange(manuallyEditedIds.filter((id) => id !== pendingOverwriteClauseId))
      onAnswersChange(pendingOverwriteAnswers)
      const regenerated = buildAllClauses(pendingOverwriteAnswers, context)
      onClausesChange(regenerated)
    }
    setPendingOverwriteClauseId(null)
    setPendingOverwriteAnswers(null)
  }

  const cancelOverwrite = () => {
    // Mantém a edição manual e não atualiza as respostas dessa cláusula
    setPendingOverwriteClauseId(null)
    setPendingOverwriteAnswers(null)
  }

  // Handlers para o Modo Avançado
  const handleUpdateClauseField = (id: string, field: 'title' | 'text', val: string) => {
    if (!manuallyEditedIds.includes(id)) {
      onManuallyEditedIdsChange([...manuallyEditedIds, id])
    }
    onClausesChange(clauses.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  const handleMoveClause = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= clauses.length) return
    const copy = [...clauses]
    const [moved] = copy.splice(index, 1)
    copy.splice(targetIndex, 0, moved)
    onClausesChange(copy)
  }

  const handleRemoveClause = (clauseId: string) => {
    onClausesChange(clauses.filter((c) => c.id !== clauseId))
  }

  const handleAddManualClause = () => {
    const newId = `cl-extra-${Date.now()}`
    onManuallyEditedIdsChange([...manuallyEditedIds, newId])
    onClausesChange([
      ...clauses,
      {
        id: newId,
        title: 'CLÁUSULA ADICIONAL',
        text: 'Descreva os termos e condições adicionais acordados entre as partes.',
      },
    ])
  }

  // Biblioteca de Cláusulas Extras (1 clique)
  const addExtraClause = (type: ExtraClauseConfig['type']) => {
    const exists = answers.extraClauses?.some((e) => e.type === type)
    if (exists && type !== 'livre') return

    const newExtra: ExtraClauseConfig = {
      id: `extra-${type}-${Date.now()}`,
      type,
      title:
        type === 'troca'
          ? 'DO VEÍCULO DADO COMO PARTE DE PAGAMENTO (TROCA)'
          : type === 'financiamento_resolutivo'
          ? 'DA CONDIÇÃO RESOLUTIVA DO FINANCIAMENTO'
          : type === 'desistencia_pos_entrega'
          ? 'DA MULTA POR DESISTÊNCIA APÓS A ENTREGA'
          : type === 'lgpd'
          ? 'DA PROTEÇÃO DE DADOS (LGPD) E CONSULTA DE CRÉDITO'
          : type === 'consignacao'
          ? 'DA INTERMEDIAÇÃO POR CONSIGNAÇÃO'
          : 'CLÁUSULA ADICIONAL PERSONALIZADA',
      params:
        type === 'troca'
          ? { summary: context.vehicleTradeInSummary || 'Veículo usado' }
          : type === 'financiamento_resolutivo'
          ? { days: 10 }
          : type === 'desistencia_pos_entrega'
          ? { percent: 10 }
          : {},
      text: type === 'livre' ? 'Termos e obrigações convencionados entre as partes.' : undefined,
    }

    const nextExtras = [...(answers.extraClauses || []), newExtra]
    updateAnswers((prev) => ({ ...prev, extraClauses: nextExtras }))
  }

  const removeExtraClause = (id: string) => {
    const nextExtras = (answers.extraClauses || []).filter((e) => e.id !== id)
    updateAnswers((prev) => ({ ...prev, extraClauses: nextExtras }))
  }

  const updateExtraParam = (id: string, paramKey: string, val: any) => {
    const nextExtras = (answers.extraClauses || []).map((e) =>
      e.id === id ? { ...e, params: { ...(e.params || {}), [paramKey]: val } } : e
    )
    updateAnswers((prev) => ({ ...prev, extraClauses: nextExtras }))
  }

  const updateExtraText = (id: string, text: string) => {
    const nextExtras = (answers.extraClauses || []).map((e) =>
      e.id === id ? { ...e, text } : e
    )
    updateAnswers((prev) => ({ ...prev, extraClauses: nextExtras }))
  }

  return (
    <div className="space-y-6">
      {/* ── BARRA SUPERIOR DE CONTROLE (MODOS + AÇÕES) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-1 border border-surface shadow-xs">
        {/* Toggle de Modos */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2/60 border border-surface self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant={clauseMode === 'questionario' ? 'default' : 'ghost'}
            onClick={() => onClauseModeChange('questionario')}
            className={`gap-1.5 text-xs rounded-lg h-8 transition-all font-semibold ${
              clauseMode === 'questionario'
                ? 'bg-brand text-brand-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Questionário Guiado
          </Button>
          <Button
            type="button"
            size="sm"
            variant={clauseMode === 'avancado' ? 'default' : 'ghost'}
            onClick={() => onClauseModeChange('avancado')}
            className={`gap-1.5 text-xs rounded-lg h-8 transition-all font-semibold ${
              clauseMode === 'avancado'
                ? 'bg-brand text-brand-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Modo Avançado ({clauses.length})
          </Button>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveTemplate}
            disabled={savingTemplate}
            className="gap-1.5 text-xs border-surface hover:bg-surface-2 rounded-xl h-8 text-foreground"
            title="Salva as respostas atuais como padrão da loja para novos contratos"
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-brand" />
            {savingTemplate ? 'Salvando padrão...' : 'Salvar como Padrão da Loja'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRestoreDefault}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar Padrão
          </Button>

          {/* Botão Mobile de Alternar Prévia */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
            className="lg:hidden text-xs border-surface rounded-xl h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {mobilePreviewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-brand" />}
            {mobilePreviewOpen ? 'Ocultar Prévia' : 'Ver Prévia'}
          </Button>
        </div>
      </div>

      {/* ── ALERTA DE SOBRESCRITA DE CLÁUSULA MANUAL ── */}
      {pendingOverwriteClauseId && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-3 animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                Esta cláusula foi editada manualmente no Modo Avançado
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você personalizou o texto desta cláusula anteriormente. Deseja substituir suas alterações pelo novo texto gerado pelo questionário?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={cancelOverwrite}
              className="text-xs border-surface h-8"
            >
              Manter Edição Manual
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmOverwrite}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold h-8"
            >
              Substituir pelo Gerado
            </Button>
          </div>
        </div>
      )}

      {/* ── VISÃO 1: QUESTIONÁRIO GUIADO COM PRÉVIA AO VIVO ── */}
      {clauseMode === 'questionario' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: CARTÕES DO QUESTIONÁRIO (7 COLUNAS DESKTOP) */}
          <div className="lg:col-span-7 space-y-4">
            {/* CARTÃO 1: ESTADO DO VEÍCULO */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4 text-brand" /> 1. Estado e Vistoria do Veículo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Como o veículo está sendo entregue e condições de inspeção pelo comprador.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Como o veículo é vendido?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { val: 'vistoriado', label: 'Vistoriado pelo Comprador', sub: 'No estado em que se encontra (padrão)' },
                      { val: 'laudo', label: 'Com Laudo Cautelar', sub: 'Perícia prévia aprovada' },
                      { val: 'sem_laudo', label: 'Sem Laudo', sub: 'Por opção das partes' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateAnswers((prev) => ({ ...prev, vehicleState: opt.val as any }), 'cl-estado')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          answers.vehicleState === opt.val
                            ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                            : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                        }`}
                      >
                        <span className="font-bold text-foreground text-xs">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {answers.vehicleState === 'laudo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-2/40 border border-surface">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Empresa Pericial</Label>
                      <Input
                        value={answers.laudoCompany || ''}
                        placeholder="Ex: SuperVisão, Dekra"
                        onChange={(e) => updateAnswers((prev) => ({ ...prev, laudoCompany: e.target.value }), 'cl-estado')}
                        className="text-xs bg-surface-1 border-surface h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Número do Laudo</Label>
                      <Input
                        value={answers.laudoNumber || ''}
                        placeholder="Ex: SV-129482/2026"
                        onChange={(e) => updateAnswers((prev) => ({ ...prev, laudoNumber: e.target.value }), 'cl-estado')}
                        className="text-xs bg-surface-1 border-surface h-8"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/30 border border-surface">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground text-xs">Vistoria de Mecânico de Confiança</span>
                    <p className="text-[11px] text-muted-foreground">
                      Declara no contrato que o comprador teve direito de levar mecânico antes de assinar.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={answers.allowMechanicInspection ? 'default' : 'outline'}
                      onClick={() => updateAnswers((prev) => ({ ...prev, allowMechanicInspection: true }), 'cl-estado')}
                      className={`h-7 px-3 text-xs rounded-lg ${
                        answers.allowMechanicInspection ? 'bg-brand text-brand-foreground' : 'border-surface'
                      }`}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!answers.allowMechanicInspection ? 'default' : 'outline'}
                      onClick={() => updateAnswers((prev) => ({ ...prev, allowMechanicInspection: false }), 'cl-estado')}
                      className={`h-7 px-3 text-xs rounded-lg ${
                        !answers.allowMechanicInspection ? 'bg-brand text-brand-foreground' : 'border-surface'
                      }`}
                    >
                      Não
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARTÃO 2: SINAL E DESISTÊNCIA (Condicional a ter Sinal) */}
            {context.hasDownPayment ? (
              <Card className="border-surface bg-surface-1 shadow-xs">
                <CardHeader className="pb-3 border-b border-surface">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4 text-brand" /> 2. Sinal de Entrada (Arras) e Desistência
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-brand/40 text-brand">
                      Sinal: {formatCurrency(context.downPaymentAmount || 0)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Regras de retenção ou devolução de arras confirmatórias (art. 417-420 CC).
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Se o comprador desistir imotivadamente:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: 'retencao_total', label: 'Retenção Integral', sub: 'Loja retém 100% (padrão)' },
                        { val: 'devolucao_total', label: 'Devolução Integral', sub: 'Sem penalidade' },
                        { val: 'retencao_percentual', label: 'Retenção Parcial (%)', sub: 'Retém percentual do sinal' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => updateAnswers((prev) => ({ ...prev, buyerWithdrawal: opt.val as any }), 'cl-sinal')}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            answers.buyerWithdrawal === opt.val
                              ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                              : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                          }`}
                        >
                          <span className="font-bold text-foreground text-xs">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground mt-1">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {answers.buyerWithdrawal === 'retencao_percentual' && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-surface">
                      <Label className="text-xs font-semibold text-foreground shrink-0">Percentual retido:</Label>
                      <div className="flex items-center gap-1.5 w-32">
                        <Input
                          type="number"
                          min={5}
                          max={90}
                          value={answers.buyerWithdrawalPercent || 20}
                          onChange={(e) =>
                            updateAnswers(
                              (prev) => ({ ...prev, buyerWithdrawalPercent: Number(e.target.value) || 20 }),
                              'cl-sinal'
                            )
                          }
                          className="text-xs bg-surface-1 border-surface h-8"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Se a loja desistir ou houver vício redibitório:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { val: 'dobro', label: 'Devolução em Dobro', sub: 'Exigência do art. 418 do Código Civil' },
                        { val: 'simples', label: 'Restituição Simples', sub: 'Devolução integral simples' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => updateAnswers((prev) => ({ ...prev, sellerWithdrawal: opt.val as any }), 'cl-sinal')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            answers.sellerWithdrawal === opt.val
                              ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                              : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                          }`}
                        >
                          <span className="font-bold text-foreground text-xs">{opt.label}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-3.5 rounded-xl border border-surface bg-surface-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground/60" /> Cláusula de Sinal e Arras: não aplicável (sem valor de sinal na Etapa 3).
                </span>
                <span className="text-[11px] text-brand">Opcional</span>
              </div>
            )}

            {/* CARTÃO 3: ENTREGA DO VEÍCULO */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand" /> 3. Tradição e Prazo de Entrega
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Quando o veículo será entregue fisicamente ao comprador e sob qual condição.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Prazo de Entrega:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateAnswers((prev) => ({ ...prev, deliveryTerm: 'imediata' }), 'cl-entrega')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        answers.deliveryTerm === 'imediata'
                          ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                          : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                      }`}
                    >
                      <span className="font-bold text-foreground text-xs">Entrega Imediata</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">No ato da assinatura e conferência de pagamento</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAnswers((prev) => ({ ...prev, deliveryTerm: 'prazo_dias' }), 'cl-entrega')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        answers.deliveryTerm === 'prazo_dias'
                          ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                          : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                      }`}
                    >
                      <span className="font-bold text-foreground text-xs">Prazo em Dias Úteis</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Definir quantidade de dias para liberação</p>
                    </button>
                  </div>
                </div>

                {answers.deliveryTerm === 'prazo_dias' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-surface">
                    <Label className="text-xs font-semibold text-foreground shrink-0">Prazo para entrega:</Label>
                    <div className="flex items-center gap-1.5 w-32">
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={answers.deliveryDays || 5}
                        onChange={(e) =>
                          updateAnswers(
                            (prev) => ({ ...prev, deliveryDays: Number(e.target.value) || 5 }),
                            'cl-entrega'
                          )
                        }
                        className="text-xs bg-surface-1 border-surface h-8"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">dias úteis</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Condição prévia para a entrega:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { val: 'quitacao', label: 'Quitação Integral', sub: 'Pagamento total confirmado' },
                      { val: 'financiamento', label: 'Aprovação de Crédito', sub: 'Liberação de banco/consórcio' },
                      { val: 'personalizado', label: 'Personalizado', sub: 'Descrever condição própria' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateAnswers((prev) => ({ ...prev, deliveryCondition: opt.val as any }), 'cl-entrega')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          answers.deliveryCondition === opt.val
                            ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                            : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                        }`}
                      >
                        <span className="font-bold text-foreground text-xs">{opt.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>

                  {answers.deliveryCondition === 'personalizado' && (
                    <Input
                      value={answers.deliveryConditionCustom || ''}
                      placeholder="Ex: da quitação de R$ 10.000 via Pix e entrega do recibo do carro em troca"
                      onChange={(e) =>
                        updateAnswers((prev) => ({ ...prev, deliveryConditionCustom: e.target.value }), 'cl-entrega')
                      }
                      className="text-xs bg-surface-1 border-surface mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CARTÃO 4: MULTAS E DÉBITOS ANTERIORES */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-brand" /> 4. Multas e Débitos Anteriores à Entrega
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Garantia de quitação de encargos pretéritos e prazo de resposta da loja.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-surface-2/30 border border-surface flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    A <strong className="text-foreground">Loja Vendedora</strong> declara que o veículo está livre de débitos e assume integral responsabilidade por multas cujo fato gerador tenha ocorrido antes da entrega.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Prazo para a loja quitar multa anterior notificada:
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[10, 15, 20, 30].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => updateAnswers((prev) => ({ ...prev, oldFinesPaymentDays: dias }), 'cl-debitos')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          answers.oldFinesPaymentDays === dias
                            ? 'border-brand bg-brand text-brand-foreground shadow-xs'
                            : 'border-surface bg-surface-2/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dias} dias úteis {dias === 15 ? '(Padrão)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARTÃO 5: TRANSFERÊNCIA DE PROPRIEDADE */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-brand" /> 5. Transferência de Propriedade no Detran
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Prazo legal, responsabilidade das custas de transferência e proteção contra omissão.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Prazo para o comprador transferir no Detran:
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[15, 30, 45].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => updateAnswers((prev) => ({ ...prev, transferDeadlineDays: dias }), 'cl-transf')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          answers.transferDeadlineDays === dias
                            ? 'border-brand bg-brand text-brand-foreground shadow-xs'
                            : 'border-surface bg-surface-2/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dias} dias {dias === 30 ? '(Detran / CTB)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Custos de transferência (taxas do Detran e vistoria):
                    </Label>
                    <span className="text-[10px] text-brand">Sincronizado da Etapa 3</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { val: 'comprador', label: 'Comprador', sub: 'Arca integralmente (padrão)' },
                      { val: 'vendedor', label: 'Loja Vendedora', sub: 'Loja custeia transferência' },
                      { val: 'dividido', label: 'Dividido (50/50)', sub: 'Rateio igualitário' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() =>
                          updateAnswers((prev) => ({ ...prev, transferFeeResponsible: opt.val as any }), 'cl-transf')
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          answers.transferFeeResponsible === opt.val
                            ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                            : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                        }`}
                      >
                        <span className="font-bold text-foreground text-xs">{opt.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/30 border border-surface">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground text-xs">Autorizar Bloqueio Administrativo</span>
                    <p className="text-[11px] text-muted-foreground">
                      Permite à loja solicitar bloqueio no Detran se o comprador descumprir o prazo de transferência.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={answers.authorizeAdministrativeBlock ? 'default' : 'outline'}
                      onClick={() => updateAnswers((prev) => ({ ...prev, authorizeAdministrativeBlock: true }), 'cl-transf')}
                      className={`h-7 px-3 text-xs rounded-lg ${
                        answers.authorizeAdministrativeBlock ? 'bg-brand text-brand-foreground' : 'border-surface'
                      }`}
                    >
                      Sim (Padrão)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!answers.authorizeAdministrativeBlock ? 'default' : 'outline'}
                      onClick={() => updateAnswers((prev) => ({ ...prev, authorizeAdministrativeBlock: false }), 'cl-transf')}
                      className={`h-7 px-3 text-xs rounded-lg ${
                        !answers.authorizeAdministrativeBlock ? 'bg-brand text-brand-foreground' : 'border-surface'
                      }`}
                    >
                      Não
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARTÃO 6: GARANTIA */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand" /> 6. Garantia do Veículo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tipo de cobertura técnica garantida ao adquirente.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { val: 'legal_90', label: 'Garantia Legal 90 Dias', sub: 'Motor e câmbio (Art. 26 CDC - padrão)' },
                    { val: 'estendida_1ano', label: 'Garantia Estendida (1 Ano)', sub: 'Com gestora ou seguradora parceira' },
                    { val: 'sem_adicional', label: 'Apenas CDC Estrito', sub: 'Sem itens de desgaste natural' },
                    { val: 'repasse', label: 'Repasse Comercial (No Estado)', sub: 'Veículo com margem de atacado' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => updateAnswers((prev) => ({ ...prev, warrantyType: opt.val as any }), 'cl-garantia')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        answers.warrantyType === opt.val
                          ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                          : 'border-surface bg-surface-2/30 text-muted-foreground hover:border-surface hover:text-foreground'
                      }`}
                    >
                      <span className="font-bold text-foreground text-xs">{opt.label}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                    </button>
                  ))}
                </div>

                {answers.warrantyType === 'estendida_1ano' && (
                  <div className="p-3 rounded-xl bg-surface-2/40 border border-surface space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Empresa Gestora / Seguradora da Garantia:</Label>
                    <Input
                      value={answers.warrantyPartner || ''}
                      placeholder="Ex: Gestauto Brasil, CarSystem, AutoFácil"
                      onChange={(e) => updateAnswers((prev) => ({ ...prev, warrantyPartner: e.target.value }), 'cl-garantia')}
                      className="text-xs bg-surface-1 border-surface h-8"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARTÃO 7: FORO DE ELEIÇÃO */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand" /> 7. Foro de Eleição
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Comarca judicial competente para resolução de eventuais litígios.
                </p>
              </CardHeader>
              <CardContent className="pt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Cidade / Comarca</Label>
                    <Input
                      value={answers.forumCity}
                      placeholder="Ex: São Paulo, Campinas"
                      onChange={(e) => updateAnswers((prev) => ({ ...prev, forumCity: e.target.value }), 'cl-foro')}
                      className="text-xs bg-surface-1 border-surface h-8"
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Estado (UF)</Label>
                    <select
                      value={answers.forumState}
                      onChange={(e) => updateAnswers((prev) => ({ ...prev, forumState: e.target.value }), 'cl-foro')}
                      className="w-full h-8 px-2 rounded-lg border border-surface bg-surface-1 text-xs text-foreground outline-none"
                    >
                      {BRAZILIAN_STATES.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── BIBLIOTECA DE CLÁUSULAS EXTRAS ── */}
            <Card className="border-surface bg-surface-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-surface">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Scale className="h-4 w-4 text-brand" /> Cláusulas Adicionais (Biblioteca de 1 Clique)
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] border-surface">
                    {answers.extraClauses?.length || 0} ativas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione termos específicos conforme as particularidades do negócio.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Botões de Adicionar Rápido */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('troca')}
                    disabled={answers.extraClauses?.some((e) => e.type === 'troca')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-foreground"
                  >
                    <Plus className="h-3 w-3 text-brand" /> Veículo na Troca
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('financiamento_resolutivo')}
                    disabled={answers.extraClauses?.some((e) => e.type === 'financiamento_resolutivo')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-foreground"
                  >
                    <Plus className="h-3 w-3 text-brand" /> Condição Financiamento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('desistencia_pos_entrega')}
                    disabled={answers.extraClauses?.some((e) => e.type === 'desistencia_pos_entrega')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-foreground"
                  >
                    <Plus className="h-3 w-3 text-brand" /> Multa Pós-Entrega
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('lgpd')}
                    disabled={answers.extraClauses?.some((e) => e.type === 'lgpd')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-foreground"
                  >
                    <Plus className="h-3 w-3 text-brand" /> Proteção LGPD
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('consignacao')}
                    disabled={answers.extraClauses?.some((e) => e.type === 'consignacao')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-foreground"
                  >
                    <Plus className="h-3 w-3 text-brand" /> Consignação
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraClause('livre')}
                    className="h-8 text-xs border-surface hover:bg-surface-2 rounded-xl gap-1 text-brand font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Cláusula Livre
                  </Button>
                </div>

                {/* Lista de Extras Ativas com controles */}
                {answers.extraClauses && answers.extraClauses.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {answers.extraClauses.map((extra) => (
                      <div
                        key={extra.id}
                        className="p-3.5 rounded-xl border border-surface bg-surface-2/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                            {extra.title}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExtraClause(extra.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Remover cláusula extra"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Parâmetros específicos */}
                        {extra.type === 'troca' && (
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Descrição do Veículo Usado na Troca:</Label>
                            <Input
                              value={extra.params?.summary || ''}
                              placeholder="Ex: Fiat Uno Way 1.0 2017 Prata Placa ABC1D23"
                              onChange={(e) => updateExtraParam(extra.id, 'summary', e.target.value)}
                              className="text-xs bg-surface-1 border-surface h-8"
                            />
                          </div>
                        )}

                        {extra.type === 'financiamento_resolutivo' && (
                          <div className="flex items-center gap-3">
                            <Label className="text-[11px] text-muted-foreground shrink-0">Prazo de aprovação do banco:</Label>
                            <div className="flex items-center gap-1.5 w-28">
                              <Input
                                type="number"
                                min={3}
                                max={30}
                                value={extra.params?.days || 10}
                                onChange={(e) => updateExtraParam(extra.id, 'days', Number(e.target.value) || 10)}
                                className="text-xs bg-surface-1 border-surface h-8"
                              />
                              <span className="text-[10px] text-muted-foreground">dias úteis</span>
                            </div>
                          </div>
                        )}

                        {extra.type === 'desistencia_pos_entrega' && (
                          <div className="flex items-center gap-3">
                            <Label className="text-[11px] text-muted-foreground shrink-0">Multa compensatória:</Label>
                            <div className="flex items-center gap-1.5 w-28">
                              <Input
                                type="number"
                                min={1}
                                max={50}
                                value={extra.params?.percent || 10}
                                onChange={(e) => updateExtraParam(extra.id, 'percent', Number(e.target.value) || 10)}
                                className="text-xs bg-surface-1 border-surface h-8"
                              />
                              <span className="text-[10px] text-muted-foreground">%</span>
                            </div>
                          </div>
                        )}

                        {extra.type === 'livre' && (
                          <div className="space-y-2">
                            <Input
                              value={extra.title}
                              placeholder="Título da Cláusula"
                              onChange={(e) => {
                                const nextExtras = (answers.extraClauses || []).map((x) =>
                                  x.id === extra.id ? { ...x, title: e.target.value } : x
                                )
                                updateAnswers((prev) => ({ ...prev, extraClauses: nextExtras }))
                              }}
                              className="text-xs font-semibold bg-surface-1 border-surface h-8"
                            />
                            <textarea
                              rows={2}
                              value={extra.text || ''}
                              placeholder="Redija o texto da cláusula livre..."
                              onChange={(e) => updateExtraText(extra.id, e.target.value)}
                              className="w-full p-2 rounded-lg border border-surface bg-surface-1 text-xs text-foreground outline-none resize-y"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aviso Fixo Legal */}
            <div className="p-3.5 rounded-xl bg-surface-2/40 border border-surface flex items-start gap-3">
              <Scale className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>Modelo padrão:</strong> Revise as cláusulas geradas com seu advogado antes de emitir e formalizar contratos com clientes.
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA: PRÉVIA AO VIVO DAS CLÁUSULAS (5 COLUNAS DESKTOP / STICKY) */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-6 space-y-4 ${
              mobilePreviewOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <Card className="border-surface bg-surface-1 shadow-md">
              <CardHeader className="pb-3 border-b border-surface flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand" /> Prévia ao Vivo do Contrato
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Atualizado em tempo real pelas perguntas.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-brand/30 text-brand">
                  {clauses.length} Cláusulas
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 max-h-[calc(100vh-180px)] overflow-y-auto space-y-3.5 pr-2">
                {clauses.map((clause, index) => (
                  <div
                    key={clause.id}
                    className="p-3 rounded-xl border border-surface bg-surface-2/30 space-y-1.5 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                        CLÁUSULA {getOrdinalFeminine(index + 1)}
                      </span>
                      {manuallyEditedIds.includes(clause.id) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Editada à mão
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-foreground text-[11px] leading-snug">
                      {stripClauseOrdinalPrefix(clause.title)}
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                      {clause.text}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── VISÃO 2: MODO AVANÇADO (EDIÇÃO COMPLETA DE TEXTOS & REORDENAÇÃO) ── */
        <Card className="border-surface bg-surface-1 shadow-xs">
          <CardHeader className="pb-3 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand" /> Modo Avançado: Edição Livre e Reordenação
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Altere títulos, redija novos textos, reordene e adicione termos adicionais.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddManualClause}
              className="gap-1.5 text-xs border-surface hover:bg-surface-2 rounded-xl h-8 text-foreground self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5 text-brand" /> Nova Cláusula Livre
            </Button>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <div className="space-y-4">
              {clauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="p-4 rounded-xl border border-surface bg-surface-2/30 space-y-2.5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="px-2.5 py-1 rounded-lg bg-surface-1 border border-surface text-[11px] font-bold text-brand uppercase tracking-wider shrink-0">
                        CLÁUSULA {getOrdinalFeminine(index + 1)}
                      </span>
                      <Input
                        value={stripClauseOrdinalPrefix(clause.title)}
                        placeholder="Ex: DA VISTORIA CAUTELAR E PROCEDÊNCIA"
                        onChange={(e) => handleUpdateClauseField(clause.id, 'title', e.target.value)}
                        className="text-xs font-bold bg-surface-1 border-surface h-8 flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMoveClause(index, 'up')}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-25"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === clauses.length - 1}
                        onClick={() => handleMoveClause(index, 'down')}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-25"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClause(clause.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        title="Remover cláusula"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={clause.text}
                    placeholder="Descreva os termos e condições desta cláusula..."
                    onChange={(e) => handleUpdateClauseField(clause.id, 'text', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-surface bg-surface-1 text-xs text-foreground outline-none resize-y leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
