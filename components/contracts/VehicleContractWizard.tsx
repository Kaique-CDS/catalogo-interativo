'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Building2,
  Car,
  DollarSign,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  FileDown,
  ExternalLink,
  Search,
  Scale,
  Sparkles,
  Loader2,
  Calendar,
  CreditCard,
  X,
  Upload,
  FileCheck,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ModernDatePicker from '@/components/ui/date-picker'
import {
  validateCpf,
  validateCnpj,
  validateCnh,
  validateRenavam,
  validatePlaca,
  validateChassi,
  validateCep,
  validateEmail,
  validatePhoneBr,
  validateRg,
  validateDate,
  maskCpf,
  maskCnpj,
  maskCpfCnpj,
  maskPhoneBr,
  maskDateBr,
  maskPlaca,
  maskChassi,
  maskRenavam,
  maskCep,
  onlyDigits,
} from '@/lib/validations'
import { toast } from 'sonner'
import type { Store, Vehicle } from '@/lib/supabase/types'
import {
  valorPorExtenso,
  formatCurrency,
  DEFAULT_SALE_CLAUSES,
  type ContractClause,
} from '@/lib/contracts/utils'
import type {
  BuyerData,
  VehicleData,
  FinancialData,
  PaymentInstallment,
} from '@/lib/contracts/pdf-generator'
import type { CrlvParsedData } from '@/lib/contracts/crlv-parser'

interface Props {
  store: Store
  slug: string
  vehicles: Vehicle[]
  preselectedVehicleId?: string | null
}

const STEPS = [
  { id: 1, title: 'Partes', icon: User, desc: 'Comprador e Loja' },
  { id: 2, title: 'Veículo', icon: Car, desc: 'Dados e Estoque' },
  { id: 3, title: 'Valores', icon: DollarSign, desc: 'Preço e Parcelas' },
  { id: 4, title: 'Cláusulas', icon: FileText, desc: 'Termos e Foro' },
  { id: 5, title: 'Revisão', icon: CheckCircle2, desc: 'Emissão e PDF' },
]

export default function VehicleContractWizard({ store, slug, vehicles, preselectedVehicleId }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [generatedContract, setGeneratedContract] = useState<{
    id: string
    number: number
  } | null>(null)

  // Controle de marcação como vendido após gerar contrato (Prompt 8)
  const [soldPromptVisible, setSoldPromptVisible] = useState(true)
  const [soldStatusUpdated, setSoldStatusUpdated] = useState(false)
  const [updatingSold, setUpdatingSold] = useState(false)

  // Feedback e pré-visualização de PDF (Fase 1)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [viewingPdf, setViewingPdf] = useState(false)
  const [generatingPreview, setGeneratingPreview] = useState(false)

  // -------------------------------------------------------------
  // PASSO 1: DADOS DO COMPRADOR E VENDEDOR
  // -------------------------------------------------------------
  const [buyerType, setBuyerType] = useState<'pf' | 'pj'>('pf')
  const [buyer, setBuyer] = useState<BuyerData>({
    type: 'pf',
    name: '',
    cpf_cnpj: '',
    rg_ie: '',
    cnh: '',
    birth_date: '',
    phone: '',
    email: '',
    address: '',
    city: store.contract_foro_cidade || 'São Paulo',
    state: store.contract_foro_estado || 'SP',
    zip: '',
    rep_name: '',
    rep_cpf: '',
  })

  // -------------------------------------------------------------
  // PASSO 2: DADOS DO VEÍCULO
  // -------------------------------------------------------------
  const [vehicle, setVehicle] = useState<VehicleData>({
    brand: '',
    model: '',
    year_fab: new Date().getFullYear(),
    year_model: new Date().getFullYear(),
    plate: '',
    chassis: '',
    renavam: '',
    color: 'Branco',
    fuel: 'Flex',
    mileage: '',
    engine: '',
    features: '',
  })
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockSearch, setStockSearch] = useState('')

  // -------------------------------------------------------------
  // CRLV DIGITAL (FASE 3)
  // -------------------------------------------------------------
  const [crlvLoading, setCrlvLoading] = useState(false)
  const [crlvModalOpen, setCrlvModalOpen] = useState(false)
  const [crlvData, setCrlvData] = useState<CrlvParsedData | null>(null)
  const [crlvFileUrl, setCrlvFileUrl] = useState<string | null>(null)
  const [crlvFileName, setCrlvFileName] = useState<string | null>(null)
  const [fillOwnerAsBuyer, setFillOwnerAsBuyer] = useState(false)
  const crlvFileInputRef = useRef<HTMLInputElement>(null)

  // -------------------------------------------------------------
  // PASSO 3: VALORES E PAGAMENTO
  // -------------------------------------------------------------
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [downPayment, setDownPayment] = useState<number>(0)
  const [downPaymentDate, setDownPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [transferResponsible, setTransferResponsible] = useState<
    'comprador' | 'vendedor' | 'dividido'
  >('comprador')
  const [transferFeeAmount, setTransferFeeAmount] = useState<number>(0)
  const [installments, setInstallments] = useState<PaymentInstallment[]>([])
  const [financialNotes, setFinancialNotes] = useState<string>('')

  // -------------------------------------------------------------
  // PASSO 4: CLÁUSULAS
  // -------------------------------------------------------------
  const [clauses, setClauses] = useState<ContractClause[]>(DEFAULT_SALE_CLAUSES)

  // -------------------------------------------------------------
  // HANDLERS DE ESTOQUE
  // -------------------------------------------------------------
  const handleSelectFromStock = (v: Vehicle) => {
    setSelectedVehicleId(v.id)
    setVehicle({
      brand: v.brand || '',
      model: v.model || v.title,
      year_fab: v.year || new Date().getFullYear(),
      year_model: v.year || new Date().getFullYear(),
      plate: (v as any).plate || (v.plate_end ? `ABC1D2${v.plate_end}` : ''),
      chassis: (v as any).chassis || '',
      renavam: (v as any).renavam || '',
      color: (v as any).color || 'Branco',
      fuel: v.fuel || 'Flex',
      mileage: v.mileage || '',
      engine: (v as any).engine || '',
      features: (v.features || []).join(', '),
    })
    if (v.price && totalAmount === 0) {
      setTotalAmount(v.price)
    }
    setStockModalOpen(false)
    toast.success(`Veículo "${v.title}" carregado do estoque com sucesso!`)
  }

  // Pré-seleciona veículo caso venha por rota/query param (Prompt 8)
  React.useEffect(() => {
    if (preselectedVehicleId && vehicles.length > 0) {
      const match = vehicles.find((v) => v.id === preselectedVehicleId)
      if (match) {
        handleSelectFromStock(match)
      }
    }
  }, [preselectedVehicleId, vehicles])

  // Marcar como vendido ao concluir o contrato (Prompt 8)
  const handleMarkVehicleAsSold = async () => {
    if (!selectedVehicleId) return
    setUpdatingSold(true)
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'vendido',
          sold_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error()
      setSoldStatusUpdated(true)
      toast.success('Veículo marcado como vendido no estoque!')
    } catch {
      toast.error('Erro ao atualizar status do veículo no estoque.')
    } finally {
      setUpdatingSold(false)
    }
  }

  // -------------------------------------------------------------
  // HANDLERS DE DOWNLOAD, VISUALIZAÇÃO E PRÉVIA (FASE 1)
  // -------------------------------------------------------------
  const handleDownloadPdf = async (contractId: string, isPrint: boolean = true) => {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/pdf?download=true${isPrint ? '&print=true' : ''}`)
      if (!res.ok) {
        throw new Error('Não foi possível gerar o arquivo PDF para download.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato-${contractId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Download do PDF concluído com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao baixar o PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleViewPdf = async (contractId: string, isPrint: boolean = true) => {
    setViewingPdf(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/pdf${isPrint ? '?print=true' : ''}`)
      if (!res.ok) {
        throw new Error('Falha ao abrir visualização do PDF.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const newWin = window.open(url, '_blank')
      if (!newWin) {
        toast.info('Popup bloqueado pelo navegador. Baixando PDF diretamente...')
        handleDownloadPdf(contractId, isPrint)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar o PDF. Iniciando download...')
      handleDownloadPdf(contractId, isPrint)
    } finally {
      setViewingPdf(false)
    }
  }

  const handlePreviewPdf = async () => {
    setGeneratingPreview(true)
    try {
      const financialPayload: FinancialData = {
        total_amount: Number(totalAmount),
        down_payment: Number(downPayment) || 0,
        down_payment_date: downPayment ? downPaymentDate : undefined,
        transfer_fee_amount: Number(transferFeeAmount) || 0,
        transfer_responsible: transferResponsible,
        installments: installments.map((inst) => ({
          number: inst.number,
          amount: Number(inst.amount) || 0,
          due_date: inst.due_date,
          method: inst.method,
          description: inst.description || '',
        })),
        notes: financialNotes || undefined,
      }

      const res = await fetch('/api/contracts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          type: 'venda_veiculo',
          buyer: { ...buyer, type: buyerType },
          vehicle,
          financial: financialPayload,
          clauses,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Falha ao compilar pré-visualização do contrato.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const newWin = window.open(url, '_blank')
      if (!newWin) {
        const a = document.createElement('a')
        a.href = url
        a.download = `Previa-Contrato-${vehicle.model || 'Veiculo'}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.info('Popup bloqueado. A prévia foi baixada diretamente!')
      } else {
        toast.success('Prévia do PDF aberta com sucesso!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar prévia.')
    } finally {
      setGeneratingPreview(false)
    }
  }

  // -------------------------------------------------------------
  // HANDLERS DO CRLV (FASE 3)
  // -------------------------------------------------------------
  const handleCrlvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCrlvLoading(true)
    const toastId = toast.loading('Lendo CRLV Digital e processando dados com IA...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)

      const res = await fetch('/api/contracts/crlv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível ler os dados do CRLV.')
      }

      setCrlvData(data.data)
      setCrlvFileUrl(data.fileUrl || null)
      setCrlvFileName(data.fileName || file.name)
      setCrlvModalOpen(true)
      toast.success('CRLV processado! Confira e confirme os dados extraídos.', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar CRLV. Você pode preencher manualmente.', {
        id: toastId,
      })
    } finally {
      setCrlvLoading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleApplyCrlvData = () => {
    if (!crlvData) return

    let brand = vehicle.brand
    let model = vehicle.model
    if (crlvData.brand_model) {
      if (crlvData.brand_model.includes('/')) {
        const parts = crlvData.brand_model.split('/')
        brand = parts[0].trim()
        model = parts.slice(1).join('/').trim()
      } else {
        const parts = crlvData.brand_model.split(' ')
        brand = parts[0].trim()
        model = parts.slice(1).join(' ').trim()
      }
    }

    setVehicle((prev) => ({
      ...prev,
      brand: brand || prev.brand,
      model: model || prev.model,
      plate: crlvData.plate ? maskPlaca(crlvData.plate) : prev.plate,
      renavam: crlvData.renavam ? maskRenavam(crlvData.renavam) : prev.renavam,
      chassis: crlvData.chassis || prev.chassis,
      year_fab: crlvData.year_fab || prev.year_fab,
      year_model: crlvData.year_model || prev.year_model,
      color: crlvData.color || prev.color,
      fuel: crlvData.fuel || prev.fuel,
      engine: crlvData.engine || prev.engine,
    }))

    if (fillOwnerAsBuyer && crlvData.owner_name) {
      setBuyer((prev) => ({
        ...prev,
        name: crlvData.owner_name || prev.name,
        cpf_cnpj: crlvData.owner_cpf_cnpj ? maskCpfCnpj(crlvData.owner_cpf_cnpj) : prev.cpf_cnpj,
      }))
    }

    setCrlvModalOpen(false)
    toast.success('Dados do CRLV aplicados com sucesso no veículo!')
  }

  // -------------------------------------------------------------
  // HANDLERS DE PARCELAS
  // -------------------------------------------------------------
  const handleAddInstallment = () => {
    const nextNumber = installments.length + 1
    const nextDate = new Date()
    nextDate.setMonth(nextDate.getMonth() + nextNumber)

    setInstallments([
      ...installments,
      {
        number: nextNumber,
        amount: 0,
        due_date: nextDate.toISOString().split('T')[0],
        method: 'Pix',
        description: '',
      },
    ])
  }

  const handleUpdateInstallment = (
    index: number,
    field: keyof PaymentInstallment,
    value: any
  ) => {
    const updated = [...installments]
    updated[index] = { ...updated[index], [field]: value }
    setInstallments(updated)
  }

  const handleRemoveInstallment = (index: number) => {
    const updated = installments
      .filter((_, i) => i !== index)
      .map((inst, i) => ({ ...inst, number: i + 1 }))
    setInstallments(updated)
  }

  const totalInstallments = installments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  const totalCalculado = (Number(downPayment) || 0) + totalInstallments
  const diferencaPreco = totalAmount - totalCalculado

  // -------------------------------------------------------------
  // HANDLERS DE CLÁUSULAS
  // -------------------------------------------------------------
  const handleAddClause = () => {
    const nextId = `cl-${Date.now()}`
    setClauses([
      ...clauses,
      {
        id: nextId,
        title: `CLÁUSULA ADICIONAL – ESPECIFIQUE O TÍTULO`,
        text: 'Descreva aqui as condições e obrigações adicionais pactuadas entre as partes.',
      },
    ])
  }

  const handleUpdateClause = (id: string, field: 'title' | 'text', val: string) => {
    setClauses(clauses.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  const handleRemoveClause = (id: string) => {
    setClauses(clauses.filter((c) => c.id !== id))
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES ENTRE ETAPAS (Fase 3: Validações Estritas)
  // -------------------------------------------------------------
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!buyer.name.trim()) {
        toast.error('Informe o nome ou razão social do comprador.')
        return false
      }
      if (buyerType === 'pf') {
        const cpfVal = validateCpf(buyer.cpf_cnpj)
        if (!cpfVal.valid) {
          toast.error(cpfVal.message || 'CPF do comprador inválido.')
          return false
        }
        if (buyer.cnh && buyer.cnh.trim()) {
          const cnhVal = validateCnh(buyer.cnh)
          if (!cnhVal.valid) {
            toast.error(cnhVal.message || 'CNH inválida.')
            return false
          }
        }
        if (buyer.birth_date && buyer.birth_date.trim()) {
          const dateVal = validateDate(buyer.birth_date, { isBirthDate: true })
          if (!dateVal.valid) {
            toast.error(dateVal.message || 'Data de nascimento inválida.')
            return false
          }
        }
      } else {
        const cnpjVal = validateCnpj(buyer.cpf_cnpj)
        if (!cnpjVal.valid) {
          toast.error(cnpjVal.message || 'CNPJ da empresa inválido.')
          return false
        }
        if (buyer.rep_cpf && buyer.rep_cpf.trim()) {
          const repVal = validateCpf(buyer.rep_cpf)
          if (!repVal.valid) {
            toast.error(`Representante: ${repVal.message}`)
            return false
          }
        }
      }

      const phoneVal = validatePhoneBr(buyer.phone)
      if (!phoneVal.valid) {
        toast.error(phoneVal.message || 'Informe um telefone ou WhatsApp válido.')
        return false
      }

      if (buyer.email && buyer.email.trim()) {
        const emailVal = validateEmail(buyer.email)
        if (!emailVal.valid) {
          toast.error(emailVal.message || 'E-mail do comprador inválido.')
          return false
        }
      }

      if (buyer.zip && buyer.zip.trim()) {
        const cepVal = validateCep(buyer.zip)
        if (!cepVal.valid) {
          toast.error(cepVal.message || 'CEP inválido.')
          return false
        }
      }
    }

    if (s === 2) {
      if (!vehicle.brand.trim() || !vehicle.model.trim()) {
        toast.error('Informe a marca e o modelo do veículo.')
        return false
      }
      const plateVal = validatePlaca(vehicle.plate)
      if (!plateVal.valid) {
        toast.error(plateVal.message || 'Informe uma placa válida para o veículo.')
        return false
      }
      if (vehicle.chassis && vehicle.chassis.trim()) {
        const chassiVal = validateChassi(vehicle.chassis)
        if (!chassiVal.valid) {
          toast.error(chassiVal.message || 'Chassi inválido.')
          return false
        }
      }
      if (vehicle.renavam && vehicle.renavam.trim()) {
        const renVal = validateRenavam(vehicle.renavam)
        if (!renVal.valid) {
          toast.error(renVal.message || 'Renavam inválido.')
          return false
        }
      }
    }

    if (s === 3) {
      if (!totalAmount || totalAmount <= 0) {
        toast.error('Informe o valor total da venda.')
        return false
      }
      if (downPayment && Number(downPayment) > 0 && downPaymentDate) {
        const dpVal = validateDate(downPaymentDate)
        if (!dpVal.valid) {
          toast.error(`Data do sinal: ${dpVal.message}`)
          return false
        }
      }
      for (const inst of installments) {
        if (inst.due_date && inst.due_date.trim()) {
          const instVal = validateDate(inst.due_date)
          if (!instVal.valid) {
            toast.error(`Parcela #${inst.number}: ${instVal.message}`)
            return false
          }
        }
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(p + 1, 5))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // -------------------------------------------------------------
  // EMISSÃO FINAL DO CONTRATO (POST /api/contracts)
  // -------------------------------------------------------------
  const handleGenerateContract = async (status: 'rascunho' | 'enviado' = 'rascunho') => {
    setGenerating(true)
    try {
      const financialPayload: FinancialData = {
        total_amount: Number(totalAmount),
        down_payment: Number(downPayment) || 0,
        down_payment_date: downPayment ? downPaymentDate : undefined,
        transfer_fee_amount: Number(transferFeeAmount) || 0,
        transfer_responsible: transferResponsible,
        installments: installments.map((inst) => ({
          number: inst.number,
          amount: Number(inst.amount) || 0,
          due_date: inst.due_date,
          method: inst.method,
          description: inst.description || '',
        })),
        notes: financialNotes || undefined,
      }

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          buyer: { ...buyer, type: buyerType },
          vehicle,
          financial: financialPayload,
          clauses,
          vehicle_id: selectedVehicleId,
          status,
          crlv_data: crlvData,
          crlv_file_url: crlvFileUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar o contrato.')
      }

      setGeneratedContract({ id: data.contract_id, number: data.number })
      toast.success(`Contrato de Venda Nº ${data.number} gerado com sucesso! 🎉`)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao gerar contrato.')
    } finally {
      setGenerating(false)
    }
  }

  // Filtro de estoque no modal
  const filteredVehicles = vehicles.filter((v) => {
    const term = stockSearch.toLowerCase()
    return (
      v.title.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term)
    )
  })

  // Se já foi gerado com sucesso, exibe tela de conclusão e downloads
  if (generatedContract) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 font-sans">
        <div className="p-8 rounded-3xl border border-surface bg-surface-1 text-center space-y-5 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Documento Criado com Sucesso
            </span>
            <h2 className="text-2xl font-black text-foreground">
              Contrato de Venda Nº {generatedContract.number}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              O contrato foi gravado no banco de dados com numeração sequencial atômica e já está pronto para impressão ou assinatura.
            </p>
          </div>

          {/* Confirmação de marcação de veículo como vendido (Prompt 8) */}
          {selectedVehicleId && !soldStatusUpdated && soldPromptVisible && (
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">
                    Marcar este veículo como vendido no estoque?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {vehicle.brand} {vehicle.model} ({vehicle.year_model})
                    {vehicle.plate ? ' · Placa: ' + vehicle.plate : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  onClick={handleMarkVehicleAsSold}
                  disabled={updatingSold}
                  className="btn-brand h-9 text-xs font-bold rounded-xl gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {updatingSold ? 'Atualizando...' : 'Sim, marcar como vendido'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSoldPromptVisible(false)}
                  className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground"
                >
                  Não marcar agora
                </Button>
              </div>
            </div>
          )}

          {soldStatusUpdated && (
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Veículo marcado com status Vendido no estoque com sucesso!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => handleDownloadPdf(generatedContract.id, true)}
              disabled={downloadingPdf}
              className="btn-brand gap-2 text-xs font-bold rounded-xl h-11 w-full sm:w-auto"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Baixando PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" /> Baixar PDF para Impressão
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleViewPdf(generatedContract.id, true)}
              disabled={viewingPdf}
              className="gap-2 text-xs rounded-xl h-11 border-surface hover:bg-surface-2 w-full sm:w-auto"
            >
              {viewingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Abrindo PDF...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" /> Visualizar PDF no Navegador
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-surface flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-xs rounded-xl border-surface hover:bg-surface-2"
            >
              Voltar ao Estoque
            </Button>
            <Link href={`/${slug}/admin/contratos`}>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                Ir para o Painel de Contratos
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGeneratedContract(null)
                setCurrentStep(1)
                setBuyer({ ...buyer, name: '', cpf_cnpj: '' })
              }}
              className="text-xs text-brand hover:underline"
            >
              Criar Outro Contrato
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28 sm:pb-20 font-sans">
      {/* ── BARRA SUPERIOR DE PROGRESSO DO WIZARD ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Novo Contrato de Venda de Veículo
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-2 sm:ml-12">
            Passo {currentStep} de 5: {STEPS[currentStep - 1].title} – {STEPS[currentStep - 1].desc}
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto max-w-full pb-1 scrollbar-hide">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isCompleted = currentStep > s.id
            const isCurrent = currentStep === s.id

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(s.id)
                  }
                }}
                className={`flex items-center justify-center gap-1.5 px-3 h-11 min-w-[44px] rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-brand text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-surface-2 text-muted-foreground hover:text-foreground opacity-60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{s.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PASSO 1: QUALIFICAÇÃO DAS PARTES                              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Vendedor (Loja) */}
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface">
              <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand" /> Dados do Vendedor (Sua Loja)
                </span>
                <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Preenchimento Automático
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-1.5 text-muted-foreground">
              <p>
                <strong className="text-foreground">Razão Social:</strong>{' '}
                {store.contract_razao_social || store.name}
              </p>
              <p>
                <strong className="text-foreground">CNPJ:</strong>{' '}
                {store.contract_cnpj || 'Não configurado (configure em Ajustes)'}
              </p>
              <p>
                <strong className="text-foreground">Endereço:</strong>{' '}
                {store.contract_address || store.address || 'Não configurado'}
              </p>
              <p>
                <strong className="text-foreground">Foro Padrão:</strong>{' '}
                {store.contract_foro_cidade || 'São Paulo'} - {store.contract_foro_estado || 'SP'}
              </p>
              {store.contract_rep_nome && (
                <p>
                  <strong className="text-foreground">Responsável Legal:</strong>{' '}
                  {store.contract_rep_nome} (CPF: {store.contract_rep_cpf || 'Não informado'})
                </p>
              )}
              <div className="pt-2">
                <Link
                  href={`/${slug}/admin/configuracoes`}
                  className="text-brand hover:underline font-semibold"
                >
                  Alterar dados da loja em Configurações &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card Comprador */}
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-brand" /> Qualificação do Comprador
              </CardTitle>
              <div className="flex bg-surface-2 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType('pf')
                    setBuyer({ ...buyer, type: 'pf' })
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    buyerType === 'pf' ? 'bg-surface-1 text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Pessoa Física (PF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType('pj')
                    setBuyer({ ...buyer, type: 'pj' })
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    buyerType === 'pj' ? 'bg-surface-1 text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Pessoa Jurídica (PJ)
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Aviso Discreto de Conformidade */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
                <span>A validação confere o formato do documento, não a existência do titular.</span>
              </div>

              {buyerType === 'pf' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Nome Completo do Comprador *</Label>
                      <Input
                        placeholder="Ex: Roberto Carlos Pereira"
                        value={buyer.name}
                        onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                        className="bg-surface-1 border-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">CPF do Comprador *</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={buyer.cpf_cnpj}
                        onChange={(e) => setBuyer({ ...buyer, cpf_cnpj: maskCpf(e.target.value) })}
                        className="bg-surface-1 border-surface font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">RG / RNE / Órgão</Label>
                      <Input
                        placeholder="Ex: 12.345.678-9 SSP/SP"
                        value={buyer.rg_ie || ''}
                        onChange={(e) => setBuyer({ ...buyer, rg_ie: e.target.value })}
                        className="bg-surface-1 border-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">CNH (opcional)</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="Nº da CNH (11 dígitos)"
                        maxLength={11}
                        value={buyer.cnh || ''}
                        onChange={(e) => setBuyer({ ...buyer, cnh: onlyDigits(e.target.value).slice(0, 11) })}
                        className="bg-surface-1 border-surface font-mono"
                      />
                    </div>
                    <ModernDatePicker
                      label="Data de Nascimento"
                      value={buyer.birth_date || ''}
                      onChange={(val) => setBuyer({ ...buyer, birth_date: val })}
                      isBirthDate={true}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Razão Social da Empresa *</Label>
                      <Input
                        placeholder="Ex: Comercial Automotiva Ltda"
                        value={buyer.name}
                        onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                        className="bg-surface-1 border-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">CNPJ *</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="00.000.000/0001-00"
                        maxLength={18}
                        value={buyer.cpf_cnpj}
                        onChange={(e) => setBuyer({ ...buyer, cpf_cnpj: maskCnpj(e.target.value) })}
                        className="bg-surface-1 border-surface font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Nome do Representante Legal</Label>
                      <Input
                        placeholder="Representante que assina pela PJ"
                        value={buyer.rep_name || ''}
                        onChange={(e) => setBuyer({ ...buyer, rep_name: e.target.value })}
                        className="bg-surface-1 border-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">CPF do Representante</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={buyer.rep_cpf || ''}
                        onChange={(e) => setBuyer({ ...buyer, rep_cpf: maskCpf(e.target.value) })}
                        className="bg-surface-1 border-surface font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Contato do Comprador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Telefone / WhatsApp *</Label>
                  <Input
                    inputMode="tel"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    value={buyer.phone}
                    onChange={(e) => setBuyer({ ...buyer, phone: maskPhoneBr(e.target.value) })}
                    className="bg-surface-1 border-surface font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">E-mail do Comprador</Label>
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="comprador@email.com"
                    value={buyer.email}
                    onChange={(e) => setBuyer({ ...buyer, email: e.target.value.trim().toLowerCase() })}
                    className="bg-surface-1 border-surface"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Necessário para envio do link e código OTP na assinatura eletrônica.
                  </p>
                </div>
              </div>

              {/* Endereço do Comprador */}
              <div className="space-y-1.5 pt-2 border-t border-surface">
                <Label className="text-xs font-semibold text-foreground">Endereço Completo (Rua, Número, Bairro)</Label>
                <Input
                  placeholder="Ex: Rua das Flores, 123, Apto 45 - Jardim Paulista"
                  value={buyer.address}
                  onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                  className="bg-surface-1 border-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Cidade</Label>
                  <Input
                    placeholder="São Paulo"
                    value={buyer.city}
                    onChange={(e) => setBuyer({ ...buyer, city: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Estado (UF)</Label>
                  <Input
                    placeholder="SP"
                    maxLength={2}
                    value={buyer.state}
                    onChange={(e) => setBuyer({ ...buyer, state: e.target.value.toUpperCase() })}
                    className="bg-surface-1 border-surface uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">CEP</Label>
                  <Input
                    placeholder="00000-000"
                    value={buyer.zip}
                    onChange={(e) => setBuyer({ ...buyer, zip: maskCep(e.target.value) })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PASSO 2: VEÍCULO                                              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4 text-brand" /> Dados do Veículo Automotor
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Importe pelo CRLV digital, selecione do estoque ou preencha manualmente.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Input de arquivo CRLV (PDF ou Foto) */}
                <input
                  ref={crlvFileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleCrlvUpload}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => crlvFileInputRef.current?.click()}
                  disabled={crlvLoading}
                  className="gap-2 text-xs border-brand/40 bg-brand/5 hover:bg-brand/10 text-brand font-semibold shrink-0 rounded-xl"
                >
                  {crlvLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                      Lendo CRLV...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-brand" />
                      Ler CRLV Digital (PDF/Foto)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStockModalOpen(true)}
                  className="gap-2 text-xs border-surface hover:bg-surface-2 shrink-0 rounded-xl"
                >
                  <Search className="h-3.5 w-3.5 text-brand" /> Puxar do Estoque
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Card de Importação / Status do CRLV */}
              {!crlvData ? (
                <div
                  onClick={() => crlvFileInputRef.current?.click()}
                  className="group relative cursor-pointer border-2 border-dashed border-surface hover:border-brand/50 rounded-2xl p-4 sm:p-5 transition-all bg-surface-2/30 hover:bg-brand/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-brand transition-colors">
                        Importar CRLV Digital (PDF) ou Foto do Documento
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Detectamos placa, Renavam, chassi, ano, proprietário e alertamos sobre gravame/alienação fiduciária.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface border border-surface text-foreground group-hover:border-brand/40 group-hover:text-brand transition-colors">
                    Selecionar Arquivo
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            CRLV Digital Carregado
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            {crlvData.source === 'text_layer' ? 'Camada de Texto' : 'OCR IA'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs sm:max-w-md">
                          {crlvFileName || 'Documento CRLV'} • Placa: {crlvData.plate || 'Não detectada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCrlvModalOpen(true)}
                        className="text-xs border-surface hover:bg-surface-2 rounded-xl h-8"
                      >
                        Conferir Dados Lidos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => crlvFileInputRef.current?.click()}
                        className="text-xs text-muted-foreground hover:text-foreground h-8"
                      >
                        Trocar Arquivo
                      </Button>
                    </div>
                  </div>

                  {/* Alerta de Alienação Fiduciária se detectada */}
                  {crlvData.has_alienacao && (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3 text-xs">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                          Atenção: Consta Alienação Fiduciária / Gravame Ativo no CRLV
                        </p>
                        <p className="text-muted-foreground">
                          {crlvData.alienacao_details || 'Restrição financeira ou alienação fiduciária registrada.'}
                        </p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Verifique a quitação e baixa do gravame perante o agente financeiro antes de efetuar a entrega e transferência do veículo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Marca / Fabricante *</Label>
                  <Input
                    placeholder="Ex: Honda, Toyota, Volkswagen"
                    value={vehicle.brand}
                    onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Modelo e Versão *</Label>
                  <Input
                    placeholder="Ex: Civic Touring 1.5 Turbo CVT"
                    value={vehicle.model}
                    onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Ano Fabricação</Label>
                  <Input
                    type="number"
                    placeholder="2022"
                    value={vehicle.year_fab}
                    onChange={(e) => setVehicle({ ...vehicle, year_fab: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Ano Modelo</Label>
                  <Input
                    type="number"
                    placeholder="2023"
                    value={vehicle.year_model}
                    onChange={(e) => setVehicle({ ...vehicle, year_model: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Placa *</Label>
                  <Input
                    autoCapitalize="characters"
                    placeholder="ABC1D23"
                    maxLength={8}
                    value={vehicle.plate}
                    onChange={(e) => setVehicle({ ...vehicle, plate: maskPlaca(e.target.value) })}
                    className="bg-surface-1 border-surface uppercase font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Renavam</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="00000000000"
                    maxLength={11}
                    value={vehicle.renavam}
                    onChange={(e) => setVehicle({ ...vehicle, renavam: maskRenavam(e.target.value) })}
                    className="bg-surface-1 border-surface font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Chassi (VIN)</Label>
                  <Input
                    autoCapitalize="characters"
                    placeholder="9BWCA... (17 chars)"
                    maxLength={17}
                    value={vehicle.chassis}
                    onChange={(e) => setVehicle({ ...vehicle, chassis: maskChassi(e.target.value) })}
                    className="bg-surface-1 border-surface uppercase font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Cor</Label>
                  <Input
                    placeholder="Preto, Prata, Branco..."
                    value={vehicle.color}
                    onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Combustível</Label>
                  <select
                    value={vehicle.fuel}
                    onChange={(e) => setVehicle({ ...vehicle, fuel: e.target.value })}
                    className="w-full h-10 rounded-xl border border-surface bg-surface-1 px-3 text-xs text-foreground outline-none"
                  >
                    <option value="Flex">Flex (Álcool/Gasolina)</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Elétrico">Elétrico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Quilometragem (Km)</Label>
                  <Input
                    placeholder="Ex: 45000"
                    value={vehicle.mileage}
                    onChange={(e) => setVehicle({ ...vehicle, mileage: e.target.value.replace(/\D/g, '') })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Motorização (opcional)</Label>
                  <Input
                    placeholder="Ex: 1.0 Turbo 3 Cilindros"
                    value={vehicle.engine || ''}
                    onChange={(e) => setVehicle({ ...vehicle, engine: e.target.value })}
                    className="bg-surface-1 border-surface"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-surface">
                <Label className="text-xs font-semibold text-foreground">Opcionais e Acessórios Relevantes</Label>
                <Input
                  placeholder="Ex: Teto solar, bancos em couro, câmera 360, rodas de liga leve 18"
                  value={vehicle.features || ''}
                  onChange={(e) => setVehicle({ ...vehicle, features: e.target.value })}
                  className="bg-surface-1 border-surface"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PASSO 3: VALORES E CONDIÇÕES DE PAGAMENTO                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand" /> Preço e Pagamento do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Valor Total + Extenso Automático */}
              <div className="p-4 rounded-2xl bg-surface-2/60 border border-surface space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="text-xs font-bold text-foreground">Valor Total da Venda (R$) *</Label>
                  <span className="text-xs font-mono font-bold text-brand">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ex: 85000"
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="text-lg font-bold bg-surface-1 border-surface"
                />
                <p className="text-xs text-muted-foreground italic">
                  <strong>Por extenso automático:</strong> {valorPorExtenso(totalAmount)}
                </p>
              </div>

              {/* Sinal e Transferência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Sinal / Entrada (Arras) - R$</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 5000"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    className="bg-surface-1 border-surface"
                  />
                </div>
                <ModernDatePicker
                  label="Data do Pagamento do Sinal"
                  value={downPaymentDate}
                  onChange={setDownPaymentDate}
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Responsável pela Transferência</Label>
                  <select
                    value={transferResponsible}
                    onChange={(e) => setTransferResponsible(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-surface bg-surface-1 px-3 text-xs text-foreground outline-none"
                  >
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor (Loja)</option>
                    <option value="dividido">Dividido (50% Comprador / 50% Loja)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Valor Estimado das Taxas / Documento (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 650"
                    value={transferFeeAmount || ''}
                    onChange={(e) => setTransferFeeAmount(parseFloat(e.target.value) || 0)}
                    className="bg-surface-1 border-surface"
                  />
                </div>
              </div>

              {/* Tabela de Parcelas */}
              <div className="pt-4 border-t border-surface space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Cronograma de Parcelas / Formas de Pagamento</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Financiamento, Pix, Cartão, Veículo na Troca ou Parcelas Diretas.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddInstallment}
                    className="text-xs rounded-xl border-surface hover:bg-surface-2 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-brand" /> Adicionar Pagamento
                  </Button>
                </div>

                {installments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-surface rounded-xl">
                    Nenhuma parcela cadastrada. Caso a venda seja quitada à vista ou via sinal integral, pode avançar.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {installments.map((inst, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl border border-surface bg-surface-2/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="sm:col-span-1 text-center font-bold text-xs text-muted-foreground">
                          #{inst.number}
                        </div>
                        <div className="sm:col-span-3">
                          <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={inst.amount || ''}
                            onChange={(e) =>
                              handleUpdateInstallment(index, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="h-9 text-xs bg-surface-1 border-surface"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Label className="text-[10px] text-muted-foreground block mb-1">Vencimento</Label>
                          <ModernDatePicker
                            value={inst.due_date}
                            onChange={(val) => handleUpdateInstallment(index, 'due_date', val)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-muted-foreground">Forma</Label>
                          <select
                            value={inst.method}
                            onChange={(e) => handleUpdateInstallment(index, 'method', e.target.value)}
                            className="w-full h-9 rounded-lg border border-surface bg-surface-1 px-2 text-xs text-foreground outline-none"
                          >
                            <option value="Pix">Pix</option>
                            <option value="TED">TED</option>
                            <option value="Financiamento">Financiamento</option>
                            <option value="Veículo na Troca">Veículo Troca</option>
                            <option value="Cartão de Crédito">Cartão Crédito</option>
                            <option value="Boleto">Boleto</option>
                            <option value="Dinheiro">Dinheiro</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] text-muted-foreground">Detalhes</Label>
                          <Input
                            placeholder="Ex: BV Financeira"
                            value={inst.description || ''}
                            onChange={(e) => handleUpdateInstallment(index, 'description', e.target.value)}
                            className="h-9 text-xs bg-surface-1 border-surface"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveInstallment(index)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Remover parcela"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conferência de Soma */}
                {installments.length > 0 && (
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-surface flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                    <div>
                      <span>Sinal: <strong>{formatCurrency(downPayment)}</strong></span>
                      {' + '}
                      <span>Parcelas: <strong>{formatCurrency(totalInstallments)}</strong></span>
                      {' = '}
                      <span>Total Computado: <strong>{formatCurrency(totalCalculado)}</strong></span>
                    </div>
                    {diferencaPreco !== 0 && (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {diferencaPreco > 0
                          ? `Restam ${formatCurrency(diferencaPreco)} para atingir o valor total.`
                          : `Soma excede o valor total em ${formatCurrency(Math.abs(diferencaPreco))}.`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Observações Livres */}
              <div className="space-y-1.5 pt-2 border-t border-surface">
                <Label className="text-xs font-semibold text-foreground">Observações Financeiras Adicionais</Label>
                <textarea
                  rows={2}
                  placeholder="Ex: Veículo dado na troca será entregue no ato da liberação do saldo do financiamento..."
                  value={financialNotes}
                  onChange={(e) => setFinancialNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface bg-surface-1 text-xs text-foreground outline-none resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PASSO 4: CLÁUSULAS CONTRATUAIS                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand" /> Cláusulas Contratuais
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Personalize ou adicione cláusulas específicas para esta negociação.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setClauses(DEFAULT_SALE_CLAUSES)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Restaurar Padrão
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddClause}
                  className="gap-1.5 text-xs border-surface hover:bg-surface-2 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 text-brand" /> Nova Cláusula
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Aviso Jurídico */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
                <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Aviso legal:</strong> Este é um modelo padrão sugerido para compra e venda de veículos seminovos. Recomendamos revisar as cláusulas com a assessoria jurídica da sua empresa antes de utilizar.
                </p>
              </div>

              {/* Lista de Cláusulas */}
              <div className="space-y-4">
                {clauses.map((clause, index) => (
                  <div
                    key={clause.id}
                    className="p-4 rounded-xl border border-surface bg-surface-2/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={clause.title}
                        onChange={(e) => handleUpdateClause(clause.id, 'title', e.target.value)}
                        className="text-xs font-bold bg-surface-1 border-surface h-8"
                      />
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

                    <textarea
                      rows={3}
                      value={clause.text}
                      onChange={(e) => handleUpdateClause(clause.id, 'text', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-surface bg-surface-1 text-xs text-foreground outline-none resize-y leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PASSO 5: REVISÃO & EMISSÃO DO CONTRATO                        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-surface bg-surface-1">
            <CardHeader className="pb-3 border-b border-surface">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Revisão Final do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              {/* Resumo das 4 áreas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Comprador */}
                <div className="p-4 rounded-2xl border border-surface bg-surface-2/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-brand" /> Comprador ({buyerType.toUpperCase()})
                  </span>
                  <p className="font-bold text-sm text-foreground">{buyer.name}</p>
                  <p className="text-muted-foreground">Documento: {buyer.cpf_cnpj}</p>
                  <p className="text-muted-foreground">Contato: {buyer.phone} • {buyer.email}</p>
                  <p className="text-muted-foreground">Endereço: {buyer.address}, {buyer.city} - {buyer.state}</p>
                </div>

                {/* Veículo */}
                <div className="p-4 rounded-2xl border border-surface bg-surface-2/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-brand" /> Veículo Automotor
                  </span>
                  <p className="font-bold text-sm text-foreground">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="text-muted-foreground">
                    Ano: {vehicle.year_fab}/{vehicle.year_model} • Cor: {vehicle.color} • Combustível: {vehicle.fuel}
                  </p>
                  <p className="text-muted-foreground font-mono">
                    Placa: {vehicle.plate} • Renavam: {vehicle.renavam || '-'}
                  </p>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    Chassi: {vehicle.chassis || '-'}
                  </p>
                </div>

                {/* Financeiro */}
                <div className="p-4 rounded-2xl border border-surface bg-surface-2/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-brand" /> Condições Financeiras
                  </span>
                  <p className="font-bold text-base text-foreground">{formatCurrency(totalAmount)}</p>
                  <p className="text-muted-foreground italic">{valorPorExtenso(totalAmount)}</p>
                  {downPayment > 0 && (
                    <p className="text-muted-foreground">Sinal / Arras: {formatCurrency(downPayment)}</p>
                  )}
                  <p className="text-muted-foreground">
                    Parcelas: {installments.length} parcela(s) cadastrada(s)
                  </p>
                  <p className="text-muted-foreground">
                    Transferência: por conta do{' '}
                    <span className="font-bold uppercase text-foreground">{transferResponsible}</span>
                  </p>
                </div>

                {/* Jurídico */}
                <div className="p-4 rounded-2xl border border-surface bg-surface-2/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-brand" /> Termos & Foro
                  </span>
                  <p className="font-semibold text-foreground">
                    {clauses.length} Cláusulas Contratuais Definidas
                  </p>
                  <p className="text-muted-foreground">
                    Foro de Eleição: Comarca de {store.contract_foro_cidade || 'São Paulo'} - {store.contract_foro_estado || 'SP'}
                  </p>
                  <p className="text-muted-foreground">
                    Assinatura Vendedor: {store.contract_rep_nome || store.name}
                  </p>
                </div>
              </div>

              {/* Botões Finais de Emissão */}
              <div className="pt-6 border-t border-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewPdf}
                  disabled={generatingPreview || generating}
                  className="rounded-xl border-surface hover:bg-surface-2 text-xs h-11 gap-1.5"
                >
                  {generatingPreview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando Prévia...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-brand" /> Visualizar Prévia do PDF
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateContract('rascunho')}
                  disabled={generating || generatingPreview}
                  className="rounded-xl border-surface hover:bg-surface-2 text-xs h-11"
                >
                  {generating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Salvar Apenas Rascunho
                </Button>
                <Button
                  type="button"
                  onClick={() => handleGenerateContract('enviado')}
                  disabled={generating}
                  className="btn-brand rounded-xl font-bold text-xs h-11 gap-2 px-6 shadow-md"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando Documento Oficial...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Gerar Contrato & Emitir PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── BOTÕES DE NAVEGAÇÃO ENTRE PASSOS (ANTERIOR / PRÓXIMO - STICKY NO MOBILE) ── */}
      <div className="sticky bottom-0 z-30 bg-surface-1/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-3 sm:py-4 border-t border-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-lg sm:shadow-none">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1 || generating}
          className="rounded-xl border-surface hover:bg-surface-2 text-xs sm:text-sm h-11 px-4 gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>

        {currentStep < 5 && (
          <Button
            type="button"
            onClick={handleNext}
            className="btn-brand rounded-xl text-xs sm:text-sm font-bold gap-1.5 px-6 h-11"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── MODAL: PUXAR DO ESTOQUE DA LOJA (BOTTOM SHEET NO MOBILE) ── */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-1 border border-surface rounded-t-3xl sm:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-bold text-foreground">Selecionar do Catálogo da Loja</h3>
              </div>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo ou título..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-surface-2/60 border-surface"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-surface">
              {filteredVehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhum veículo encontrado no estoque da loja.
                </p>
              ) : (
                filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectFromStock(v)}
                    className="w-full text-left p-3 rounded-xl hover:bg-surface-2 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-foreground group-hover:text-brand truncate">
                        {v.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {v.brand} {v.model} • {v.year} • {v.color || 'Cor não inf.'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-foreground shrink-0 font-mono">
                      {formatCurrency(v.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFERIR E EDITAR DADOS DO CRLV (FASE 3) ── */}
      {crlvModalOpen && crlvData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface-1 border border-surface rounded-2xl p-5 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-surface pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Conferir Dados Lidos do CRLV</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Origem:{' '}
                    <span className="font-semibold text-brand">
                      {crlvData.source === 'text_layer'
                        ? 'Camada de Texto Nativa (PDF)'
                        : 'OCR Multimodal Inteligente'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCrlvModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo com rolagem */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Alerta de Alienação Fiduciária se detectada */}
              {crlvData.has_alienacao && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      Atenção: Consta Alienação Fiduciária / Gravame no CRLV
                    </p>
                    <p className="text-muted-foreground">
                      {crlvData.alienacao_details || 'Restrição financeira ou arrendamento mercantil ativo.'}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      O veículo precisa de quitação e baixa de gravame antes da transferência de titularidade.
                    </p>
                  </div>
                </div>
              )}

              {/* Dados do Veículo */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-brand" /> Dados do Veículo
                </h4>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Marca / Modelo</Label>
                  <Input
                    value={crlvData.brand_model || ''}
                    onChange={(e) => setCrlvData({ ...crlvData, brand_model: e.target.value })}
                    placeholder="Ex: HONDA/CIVIC TOURING"
                    className="bg-surface-2/60 border-surface text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Placa</Label>
                    <Input
                      value={crlvData.plate || ''}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, plate: maskPlaca(e.target.value) })
                      }
                      placeholder="ABC1D23"
                      className="bg-surface-2/60 border-surface text-xs h-9 uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Renavam</Label>
                    <Input
                      value={crlvData.renavam || ''}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, renavam: maskRenavam(e.target.value) })
                      }
                      placeholder="00000000000"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Ano Fab.</Label>
                    <Input
                      type="number"
                      value={crlvData.year_fab || ''}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, year_fab: Number(e.target.value) || undefined })
                      }
                      placeholder="2022"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Ano Mod.</Label>
                    <Input
                      type="number"
                      value={crlvData.year_model || ''}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, year_model: Number(e.target.value) || undefined })
                      }
                      placeholder="2023"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Chassi (VIN)</Label>
                    <Input
                      value={crlvData.chassis || ''}
                      maxLength={17}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, chassis: e.target.value.toUpperCase() })
                      }
                      placeholder="9BWCA..."
                      className="bg-surface-2/60 border-surface text-xs h-9 uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Cor Predominante</Label>
                    <Input
                      value={crlvData.color || ''}
                      onChange={(e) => setCrlvData({ ...crlvData, color: e.target.value })}
                      placeholder="Ex: Preto"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Combustível</Label>
                    <Input
                      value={crlvData.fuel || ''}
                      onChange={(e) => setCrlvData({ ...crlvData, fuel: e.target.value })}
                      placeholder="Ex: Flex"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                </div>

                {crlvData.engine && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Motor / Cilindrada</Label>
                    <Input
                      value={crlvData.engine || ''}
                      onChange={(e) => setCrlvData({ ...crlvData, engine: e.target.value })}
                      placeholder="Ex: 1.5 Turbo"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                )}
              </div>

              {/* Dados do Proprietário no CRLV */}
              <div className="pt-3 border-t border-surface space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand" /> Proprietário Registrado no Documento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Nome Completo</Label>
                    <Input
                      value={crlvData.owner_name || ''}
                      onChange={(e) => setCrlvData({ ...crlvData, owner_name: e.target.value })}
                      placeholder="Nome do proprietário no CRLV"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">CPF / CNPJ</Label>
                    <Input
                      value={crlvData.owner_cpf_cnpj ? maskCpfCnpj(crlvData.owner_cpf_cnpj) : ''}
                      onChange={(e) =>
                        setCrlvData({ ...crlvData, owner_cpf_cnpj: e.target.value })
                      }
                      placeholder="000.000.000-00"
                      className="bg-surface-2/60 border-surface text-xs h-9"
                    />
                  </div>
                </div>

                {/* Opção de preencher comprador */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-surface bg-surface-2/40 cursor-pointer hover:bg-surface-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={fillOwnerAsBuyer}
                    onChange={(e) => setFillOwnerAsBuyer(e.target.checked)}
                    className="h-4 w-4 rounded border-surface text-brand focus:ring-brand"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">
                      Preencher comprador com os dados deste proprietário
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Útil caso o contrato seja de compra/consignação ou venda direta com o titular do documento.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-3 border-t border-surface flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCrlvModalOpen(false)}
                className="rounded-xl text-xs border-surface hover:bg-surface-2"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyCrlvData}
                className="btn-brand rounded-xl text-xs font-bold gap-1.5 px-4"
              >
                <CheckCircle2 className="h-4 w-4" /> Aplicar Dados no Veículo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
