'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Building2,
  Car,
  Scale,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
  X,
  Upload,
  FileCheck,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Search,
  ExternalLink,
  Printer,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ModernDatePicker from '@/components/ui/date-picker'
import {
  validateCpf,
  validateCnpj,
  validateCpfOrCnpj,
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
  DEFAULT_POA_FIXED_POWERS,
  DEFAULT_POA_LIABILITY,
  DEFAULT_POA_LEGAL_NOTICE,
} from '@/lib/contracts/utils'
import type {
  PowerOfAttorneyParty,
  VehicleData,
} from '@/lib/contracts/pdf-generator'
import type { CrlvParsedData } from '@/lib/contracts/crlv-parser'

interface Props {
  store: Store
  slug: string
  vehicles: Vehicle[]
}

const STEPS = [
  { id: 1, title: 'Partes', icon: User, desc: 'Outorgante e Outorgado' },
  { id: 2, title: 'Veículo', icon: Car, desc: 'Dados e CRLV' },
  { id: 3, title: 'Poderes', icon: Scale, desc: 'Validade e Termos' },
  { id: 4, title: 'Revisão', icon: CheckCircle2, desc: 'Emissão e Assinatura' },
]

export default function PowerOfAttorneyWizard({ store, slug, vehicles }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [generatedPoa, setGeneratedPoa] = useState<{
    id: string
    number: number
    signers?: any
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // -------------------------------------------------------------
  // PASSO 1: OUTORGANTE (QUEM CONCEDE) E OUTORGADO (QUEM RECEBE)
  // -------------------------------------------------------------
  const [grantor, setGrantor] = useState<PowerOfAttorneyParty>({
    type: 'pf',
    name: '',
    cpf_cnpj: '',
    rg_ie: '',
    cnh: '',
    nationality: 'brasileira',
    marital_status: 'solteiro(a)',
    profession: '',
    phone: '',
    email: '',
    address: '',
    city: store.contract_foro_cidade || 'São Paulo',
    state: store.contract_foro_estado || 'SP',
    zip: '',
    rep_name: '',
    rep_cpf: '',
    rep_role: '',
  })

  const [grantee, setGrantee] = useState<PowerOfAttorneyParty>({
    type: store.contract_cnpj ? 'pj' : 'pf',
    name: store.contract_razao_social || store.name,
    cpf_cnpj: store.contract_cnpj || store.contract_rep_cpf || '',
    rg_ie: '',
    cnh: '',
    nationality: 'brasileira',
    marital_status: '',
    profession: 'Comerciante automotivo',
    phone: store.contract_phone || store.whatsapp || '',
    email: store.contract_email || store.email || '',
    address: store.contract_address || store.address || '',
    city: store.contract_foro_cidade || 'São Paulo',
    state: store.contract_foro_estado || 'SP',
    zip: '',
    rep_name: store.contract_rep_nome || '',
    rep_cpf: store.contract_rep_cpf || '',
    rep_role: 'Administrador(a)',
  })

  const handleFillStoreAsGrantee = () => {
    setGrantee({
      type: store.contract_cnpj ? 'pj' : 'pf',
      name: store.contract_razao_social || store.name,
      cpf_cnpj: store.contract_cnpj || store.contract_rep_cpf || '',
      rg_ie: '',
      cnh: '',
      nationality: 'brasileira',
      marital_status: '',
      profession: 'Comerciante automotivo',
      phone: store.contract_phone || store.whatsapp || '',
      email: store.contract_email || store.email || '',
      address: store.contract_address || store.address || '',
      city: store.contract_foro_cidade || 'São Paulo',
      state: store.contract_foro_estado || 'SP',
      zip: '',
      rep_name: store.contract_rep_nome || '',
      rep_cpf: store.contract_rep_cpf || '',
      rep_role: 'Administrador(a)',
    })
    toast.success('Dados da loja aplicados como Outorgado(a)!')
  }

  const handleFillStoreAsGrantor = () => {
    setGrantor({
      type: store.contract_cnpj ? 'pj' : 'pf',
      name: store.contract_razao_social || store.name,
      cpf_cnpj: store.contract_cnpj || store.contract_rep_cpf || '',
      rg_ie: '',
      cnh: '',
      nationality: 'brasileira',
      marital_status: '',
      profession: 'Comércio de veículos',
      phone: store.contract_phone || store.whatsapp || '',
      email: store.contract_email || store.email || '',
      address: store.contract_address || store.address || '',
      city: store.contract_foro_cidade || 'São Paulo',
      state: store.contract_foro_estado || 'SP',
      zip: '',
      rep_name: store.contract_rep_nome || '',
      rep_cpf: store.contract_rep_cpf || '',
      rep_role: 'Administrador(a)',
    })
    toast.success('Dados da loja aplicados como Outorgante!')
  }

  // -------------------------------------------------------------
  // PASSO 2: DADOS DO VEÍCULO & CRLV
  // -------------------------------------------------------------
  const [vehicle, setVehicle] = useState<VehicleData>({
    brand: '',
    model: '',
    year_fab: new Date().getFullYear(),
    year_model: new Date().getFullYear(),
    plate: '',
    chassis: '',
    renavam: '',
    color: '',
    fuel: 'Flex',
    mileage: '',
    engine: '',
    features: '',
  })

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockSearch, setStockSearch] = useState('')

  // CRLV Upload & OCR
  const [crlvLoading, setCrlvLoading] = useState(false)
  const [crlvModalOpen, setCrlvModalOpen] = useState(false)
  const [crlvData, setCrlvData] = useState<CrlvParsedData | null>(null)
  const [crlvFileUrl, setCrlvFileUrl] = useState<string | null>(null)
  const [crlvFileName, setCrlvFileName] = useState<string>('')
  const [fillOwnerAsGrantor, setFillOwnerAsGrantor] = useState(true)
  const crlvInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFromStock = (v: Vehicle) => {
    setSelectedVehicleId(v.id)
    setVehicle({
      brand: v.brand || '',
      model: v.model || v.title,
      year_fab: v.year || new Date().getFullYear(),
      year_model: v.year || new Date().getFullYear(),
      plate: v.plate_end ? `ABC1D2${v.plate_end}` : '',
      chassis: '',
      renavam: '',
      color: v.color || 'Branco',
      fuel: v.fuel || 'Flex',
      mileage: v.mileage || '',
      engine: '',
      features: (v.features || []).join(', '),
    })
    setStockModalOpen(false)
    toast.success(`Veículo "${v.title}" carregado do estoque!`)
  }

  const handleCrlvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCrlvLoading(true)
    const toastId = toast.loading('Processando CRLV Digital e lendo dados com IA...')

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
      toast.success('CRLV processado! Confira os dados extraídos.', { id: toastId })
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

    if (fillOwnerAsGrantor && crlvData.owner_name) {
      setGrantor((prev) => ({
        ...prev,
        name: crlvData.owner_name || prev.name,
        cpf_cnpj: crlvData.owner_cpf_cnpj
          ? maskCpfCnpj(crlvData.owner_cpf_cnpj)
          : prev.cpf_cnpj,
        type:
          crlvData.owner_cpf_cnpj && crlvData.owner_cpf_cnpj.replace(/\D/g, '').length > 11
            ? 'pj'
            : 'pf',
      }))

      toast.success('Dados do proprietário do CRLV aplicados como Outorgante!')
    }

    setCrlvModalOpen(false)
    toast.success('Dados do CRLV importados para a Procuração!')
  }

  // -------------------------------------------------------------
  // PASSO 3: PODERES, VALIDADE E TERMOS
  // -------------------------------------------------------------
  const [validityDays, setValidityDays] = useState<number>(365)
  const [additionalPowers, setAdditionalPowers] = useState<string>('')
  const [observations, setObservations] = useState<string>('')

  // Cálculo de data de expiração
  const calcExpDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + (Number(validityDays) || 365))
    return d.toLocaleDateString('pt-BR')
  }

  // -------------------------------------------------------------
  // PASSO 4: VALIDAÇÕES & EMISSÃO
  // -------------------------------------------------------------
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!grantor.name.trim() || grantor.name.trim().length < 3) {
        toast.error('Informe o nome completo ou razão social do Outorgante.')
        return false
      }

      const grantorDoc = validateCpfOrCnpj(grantor.cpf_cnpj)
      if (!grantorDoc.valid) {
        toast.error(`Outorgante: ${grantorDoc.message || 'CPF ou CNPJ inválido'}`)
        return false
      }

      if (grantor.rg_ie && grantor.rg_ie.trim()) {
        const rgVal = validateRg(grantor.rg_ie)
        if (!rgVal.valid) {
          toast.warning(`Outorgante: ${rgVal.warning || rgVal.message}`)
        }
      }

      if (grantor.phone && grantor.phone.trim()) {
        const phoneVal = validatePhoneBr(grantor.phone)
        if (!phoneVal.valid) {
          toast.error(`Outorgante: ${phoneVal.message}`)
          return false
        }
      } else {
        toast.error('Informe o telefone / WhatsApp do Outorgante.')
        return false
      }

      if (grantor.email && grantor.email.trim()) {
        const emailVal = validateEmail(grantor.email)
        if (!emailVal.valid) {
          toast.error(`Outorgante: ${emailVal.message}`)
          return false
        }
      } else {
        toast.error('Informe o e-mail do Outorgante para assinatura digital.')
        return false
      }

      if (grantor.zip && grantor.zip.trim()) {
        const cepVal = validateCep(grantor.zip)
        if (!cepVal.valid) {
          toast.error(`Outorgante: ${cepVal.message}`)
          return false
        }
      }

      if (!grantee.name.trim() || grantee.name.trim().length < 3) {
        toast.error('Informe o nome completo ou razão social do Outorgado.')
        return false
      }

      const granteeDoc = validateCpfOrCnpj(grantee.cpf_cnpj)
      if (!granteeDoc.valid) {
        toast.error(`Outorgado: ${granteeDoc.message || 'CPF ou CNPJ inválido'}`)
        return false
      }

      if (grantee.phone && grantee.phone.trim()) {
        const phoneVal = validatePhoneBr(grantee.phone)
        if (!phoneVal.valid) {
          toast.error(`Outorgado: ${phoneVal.message}`)
          return false
        }
      } else {
        toast.error('Informe o telefone / WhatsApp do Outorgado.')
        return false
      }

      if (grantee.email && grantee.email.trim()) {
        const emailVal = validateEmail(grantee.email)
        if (!emailVal.valid) {
          toast.error(`Outorgado: ${emailVal.message}`)
          return false
        }
      } else {
        toast.error('Informe o e-mail do Outorgado.')
        return false
      }

      if (grantee.zip && grantee.zip.trim()) {
        const cepVal = validateCep(grantee.zip)
        if (!cepVal.valid) {
          toast.error(`Outorgado: ${cepVal.message}`)
          return false
        }
      }

      return true
    }

    if (step === 2) {
      if (!vehicle.brand.trim() || !vehicle.model.trim()) {
        toast.error('Informe a marca e o modelo do veículo.')
        return false
      }

      const plateVal = validatePlaca(vehicle.plate)
      if (!plateVal.valid) {
        toast.error(plateVal.message || 'Placa do veículo inválida.')
        return false
      }

      if (vehicle.renavam && vehicle.renavam.trim()) {
        const renavamVal = validateRenavam(vehicle.renavam)
        if (!renavamVal.valid) {
          toast.error(renavamVal.message || 'Renavam inválido.')
          return false
        }
      }

      if (vehicle.chassis && vehicle.chassis.trim()) {
        const chassisVal = validateChassi(vehicle.chassis)
        if (!chassisVal.valid) {
          toast.error(chassisVal.message || 'Chassi inválido.')
          return false
        }
      }

      return true
    }

    if (step === 3) {
      if (!validityDays || validityDays <= 0 || validityDays > 1825) {
        toast.error('Informe um prazo de validade válido (entre 1 e 1825 dias).')
        return false
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGeneratePoa = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    setGenerating(true)
    const toastId = toast.loading('Gerando Procuração e configurando assinatura...')

    try {
      const payload = {
        slug,
        type: 'procuracao',
        grantor,
        grantee,
        buyer: grantor, // retrocompatibilidade
        vehicle,
        vehicle_id: selectedVehicleId || undefined,
        validity_days: Number(validityDays) || 365,
        additional_powers: additionalPowers.trim() || undefined,
        notes: observations.trim() || undefined,
        crlv_data: crlvData || undefined,
        crlv_file_url: crlvFileUrl || undefined,
      }

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar procuração.')
      }

      setGeneratedPoa({
        id: data.contract_id || data.contract?.id,
        number: data.number,
        signers: data.signers,
      })
      toast.success(`Procuração Nº ${data.number} emitida com sucesso!`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Falha ao emitir procuração.', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  const copySigningLink = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      toast.success('Link de assinatura copiado para a área de transferência!')
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-20">
      {/* Barra de Progresso Mobile-First */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isDone = currentStep > step.id
            return (
              <button
                key={step.id}
                onClick={() => {
                  if (isDone) setCurrentStep(step.id)
                }}
                disabled={!isDone && !isActive}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : isDone
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'text-zinc-400 opacity-60'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white dark:text-zinc-900'
                      : isDone
                      ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="leading-tight">{step.title}</p>
                  <p className="text-[10px] font-normal opacity-70">{step.desc}</p>
                </div>
                <span className="sm:hidden">{step.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo dos Passos */}
      <div className="space-y-6">
        {/* Banner discreto de conformidade com documentos */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span>A validação confere o formato do documento, não a existência do titular.</span>
        </div>

        {/* ========================================================= */}
        {/* PASSO 1: PARTES (OUTORGANTE E OUTORGADO)                   */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Bloco 1: OUTORGANTE */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 uppercase tracking-wider">
                      Quem Concede os Poderes
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    1. Outorgante (Proprietário / Titular)
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pessoa física ou jurídica dona do veículo que transfere os poderes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillStoreAsGrantor}
                    className="text-xs rounded-xl dark:border-zinc-700"
                  >
                    Usar dados da loja
                  </Button>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setGrantor((p) => ({ ...p, type: 'pf' }))}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        grantor.type === 'pf'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      Pessoa Física
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantor((p) => ({ ...p, type: 'pj' }))}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        grantor.type === 'pj'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      Pessoa Jurídica
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {grantor.type === 'pf' ? 'Nome Completo *' : 'Razão Social *'}
                    </Label>
                    <Input
                      value={grantor.name}
                      onChange={(e) => setGrantor((p) => ({ ...p, name: e.target.value }))}
                      placeholder={grantor.type === 'pf' ? 'Ex: João da Silva' : 'Ex: Auto Peças e Veículos Ltda'}
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {grantor.type === 'pf' ? 'CPF *' : 'CNPJ *'}
                    </Label>
                    <Input
                      value={grantor.cpf_cnpj}
                      inputMode="numeric"
                      onChange={(e) =>
                        setGrantor((p) => ({ ...p, cpf_cnpj: maskCpfCnpj(e.target.value) }))
                      }
                      placeholder={grantor.type === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'}
                      maxLength={18}
                      className="rounded-xl font-mono dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  {grantor.type === 'pf' ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        RG / Órgão Emissor
                      </Label>
                      <Input
                        value={grantor.rg_ie || ''}
                        onChange={(e) => setGrantor((p) => ({ ...p, rg_ie: e.target.value }))}
                        placeholder="Ex: 12.345.678-9 SSP/SP"
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Inscrição Estadual (opcional)
                      </Label>
                      <Input
                        value={grantor.rg_ie || ''}
                        onChange={(e) => setGrantor((p) => ({ ...p, rg_ie: e.target.value }))}
                        placeholder="Ex: 123.456.789.000"
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  )}

                  {grantor.type === 'pf' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Nacionalidade & Estado Civil
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={grantor.nationality || ''}
                            onChange={(e) => setGrantor((p) => ({ ...p, nationality: e.target.value }))}
                            placeholder="Ex: brasileira"
                            className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-xs"
                          />
                          <Input
                            value={grantor.marital_status || ''}
                            onChange={(e) => setGrantor((p) => ({ ...p, marital_status: e.target.value }))}
                            placeholder="Ex: casado(a)"
                            className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Profissão
                        </Label>
                        <Input
                          value={grantor.profession || ''}
                          onChange={(e) => setGrantor((p) => ({ ...p, profession: e.target.value }))}
                          placeholder="Ex: Engenheiro(a), Autônomo(a)"
                          className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      WhatsApp / Telefone *
                    </Label>
                    <Input
                      value={grantor.phone}
                      inputMode="tel"
                      onChange={(e) => setGrantor((p) => ({ ...p, phone: maskPhoneBr(e.target.value) }))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      E-mail (para assinatura digital OTP) *
                    </Label>
                    <Input
                      type="email"
                      inputMode="email"
                      value={grantor.email}
                      onChange={(e) => setGrantor((p) => ({ ...p, email: e.target.value.toLowerCase().trim() }))}
                      placeholder="outorgante@email.com"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Endereço Completo (Rua, Número, Bairro)
                    </Label>
                    <Input
                      value={grantor.address}
                      onChange={(e) => setGrantor((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Ex: Av. Brasil, 1500, Centro"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Cidade
                      </Label>
                      <Input
                        value={grantor.city}
                        onChange={(e) => setGrantor((p) => ({ ...p, city: e.target.value }))}
                        placeholder="São Paulo"
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        UF
                      </Label>
                      <Input
                        value={grantor.state}
                        onChange={(e) => setGrantor((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
                        placeholder="SP"
                        maxLength={2}
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        CEP
                      </Label>
                      <Input
                        value={grantor.zip}
                        inputMode="numeric"
                        onChange={(e) => setGrantor((p) => ({ ...p, zip: maskCep(e.target.value) }))}
                        placeholder="00000-000"
                        maxLength={9}
                        className="rounded-xl font-mono dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloco 2: OUTORGADO */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 uppercase tracking-wider">
                      Quem Recebe os Poderes
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    2. Outorgado(a) (Representante / Loja)
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pessoa física ou empresa com poderes para vender e transferir o carro no Detran.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillStoreAsGrantee}
                    className="text-xs rounded-xl dark:border-zinc-700 font-bold bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    ⚡ Preencher com dados da Loja
                  </Button>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setGrantee((p) => ({ ...p, type: 'pf' }))}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        grantee.type === 'pf'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      PF
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantee((p) => ({ ...p, type: 'pj' }))}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        grantee.type === 'pj'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      PJ
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {grantee.type === 'pf' ? 'Nome Completo do Outorgado *' : 'Razão Social da Loja / Empresa *'}
                    </Label>
                    <Input
                      value={grantee.name}
                      onChange={(e) => setGrantee((p) => ({ ...p, name: e.target.value }))}
                      placeholder={grantee.type === 'pf' ? 'Ex: Carlos Eduardo Silveira' : 'Ex: Milhaticar Veículos Ltda'}
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {grantee.type === 'pf' ? 'CPF do Outorgado *' : 'CNPJ da Empresa *'}
                    </Label>
                    <Input
                      value={grantee.cpf_cnpj}
                      inputMode="numeric"
                      onChange={(e) =>
                        setGrantee((p) => ({ ...p, cpf_cnpj: maskCpfCnpj(e.target.value) }))
                      }
                      placeholder={grantee.type === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'}
                      maxLength={18}
                      className="rounded-xl font-mono dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  {grantee.type === 'pj' ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Representante Legal (quem assina pela loja)
                      </Label>
                      <Input
                        value={grantee.rep_name || ''}
                        onChange={(e) => setGrantee((p) => ({ ...p, rep_name: e.target.value }))}
                        placeholder="Nome do responsável"
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        RG / Profissão
                      </Label>
                      <Input
                        value={grantee.profession || ''}
                        onChange={(e) => setGrantee((p) => ({ ...p, profession: e.target.value }))}
                        placeholder="Ex: Comerciante automotivo"
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Telefone / WhatsApp *
                    </Label>
                    <Input
                      value={grantee.phone}
                      inputMode="tel"
                      onChange={(e) => setGrantee((p) => ({ ...p, phone: maskPhoneBr(e.target.value) }))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      E-mail *
                    </Label>
                    <Input
                      type="email"
                      inputMode="email"
                      value={grantee.email}
                      onChange={(e) => setGrantee((p) => ({ ...p, email: e.target.value.toLowerCase().trim() }))}
                      placeholder="outorgado@empresa.com"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Endereço Completo
                    </Label>
                    <Input
                      value={grantee.address}
                      onChange={(e) => setGrantee((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Ex: Av. dos Bandeirantes, 3000"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 2: VEÍCULO & CRLV                                    */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Banner de Leitura do CRLV Digital */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    Leitura Automática de CRLV Digital
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      IA + Senatran
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Faça upload do PDF ou foto do documento do veículo para preenchimento instantâneo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  ref={crlvInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleCrlvUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => crlvInputRef.current?.click()}
                  disabled={crlvLoading}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs"
                >
                  {crlvLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Lendo CRLV...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Importar CRLV
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStockModalOpen(true)}
                  className="text-xs rounded-xl dark:border-zinc-700 shrink-0"
                >
                  Buscar no Estoque
                </Button>
              </div>
            </div>

            {/* Formulário do Veículo */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Identificação do Veículo
                </CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Dados do veículo que constarão na procuração com poderes expressos para alienação.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Marca / Fabricante *
                    </Label>
                    <Input
                      value={vehicle.brand}
                      onChange={(e) => setVehicle((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="Ex: Toyota, Honda, Volkswagen"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Modelo / Versão *
                    </Label>
                    <Input
                      value={vehicle.model}
                      onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))}
                      placeholder="Ex: Corolla Altis Premium 2.0 Flex"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Placa do Veículo *
                    </Label>
                    <Input
                      value={vehicle.plate}
                      inputMode="text"
                      onChange={(e) =>
                        setVehicle((p) => ({ ...p, plate: maskPlaca(e.target.value) }))
                      }
                      placeholder="ABC1D23"
                      maxLength={7}
                      className="rounded-xl uppercase font-mono dark:bg-zinc-800 dark:border-zinc-700 text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Renavam
                    </Label>
                    <Input
                      value={vehicle.renavam}
                      inputMode="numeric"
                      onChange={(e) =>
                        setVehicle((p) => ({ ...p, renavam: maskRenavam(e.target.value) }))
                      }
                      placeholder="00000000000"
                      maxLength={11}
                      className="rounded-xl font-mono dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Chassi
                    </Label>
                    <Input
                      value={vehicle.chassis}
                      inputMode="text"
                      onChange={(e) =>
                        setVehicle((p) => ({ ...p, chassis: maskChassi(e.target.value) }))
                      }
                      placeholder="9BWCA..."
                      maxLength={17}
                      className="rounded-xl uppercase font-mono dark:bg-zinc-800 dark:border-zinc-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Ano Fab.
                      </Label>
                      <Input
                        type="number"
                        value={vehicle.year_fab}
                        onChange={(e) => setVehicle((p) => ({ ...p, year_fab: e.target.value }))}
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Ano Mod.
                      </Label>
                      <Input
                        type="number"
                        value={vehicle.year_model}
                        onChange={(e) => setVehicle((p) => ({ ...p, year_model: e.target.value }))}
                        className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Cor
                    </Label>
                    <Input
                      value={vehicle.color}
                      onChange={(e) => setVehicle((p) => ({ ...p, color: e.target.value }))}
                      placeholder="Ex: Prata, Preto, Branco"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Combustível
                    </Label>
                    <Input
                      value={vehicle.fuel}
                      onChange={(e) => setVehicle((p) => ({ ...p, fuel: e.target.value }))}
                      placeholder="Flex, Gasolina, Diesel, Híbrido"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Motor (opcional)
                    </Label>
                    <Input
                      value={vehicle.engine || ''}
                      onChange={(e) => setVehicle((p) => ({ ...p, engine: e.target.value }))}
                      placeholder="Ex: 2.0 16V"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Quilometragem (Km)
                    </Label>
                    <Input
                      value={vehicle.mileage || ''}
                      onChange={(e) => setVehicle((p) => ({ ...p, mileage: e.target.value }))}
                      placeholder="Ex: 45.000"
                      className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 3: PODERES, VALIDADE E TERMOS                        */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Texto de Poderes Fixos */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 uppercase tracking-wider">
                    Cláusula Fixa de Mandato
                  </span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1">
                  Poderes Especiais e Expressos
                </CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Termo jurídico completo e abrangente para transferências veiculares no Brasil.
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {DEFAULT_POA_FIXED_POWERS}
                </div>

                {/* Responsabilidade Civil e Criminal */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    Responsabilidade Civil, Criminal e Multas
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {DEFAULT_POA_LIABILITY}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Validade e Poderes Adicionais */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Validade e Condições Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Prazo de Validade (em dias) *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={30}
                        max={1825}
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                        className="rounded-xl w-32 font-bold text-sm dark:bg-zinc-800 dark:border-zinc-700"
                      />
                      <span className="text-xs text-zinc-500">dias</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setValidityDays(180)}
                          className="px-2 py-1 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                        >
                          6 meses
                        </button>
                        <button
                          type="button"
                          onClick={() => setValidityDays(365)}
                          className="px-2 py-1 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 font-bold"
                        >
                          1 ano (padrão)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs">
                    <p className="text-zinc-500 dark:text-zinc-400">Data estimada de expiração:</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                      📅 {calcExpDate()}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Poderes Adicionais Específicos (opcional)
                  </Label>
                  <textarea
                    value={additionalPowers}
                    onChange={(e) => setAdditionalPowers(e.target.value)}
                    rows={3}
                    placeholder="Ex: Poderes específicos para receber indenização de sinistro da seguradora XYZ, processo nº..."
                    className="w-full rounded-xl p-3 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Observações Complementares (opcional)
                  </Label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={2}
                    placeholder="Anotações internas ou observações para constar no documento..."
                    className="w-full rounded-xl p-3 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aviso do Detran / Cartório */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Aviso Importante sobre Detran e Reconhecimento de Firma
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 leading-relaxed">
                  {DEFAULT_POA_LEGAL_NOTICE}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 4: REVISÃO & EMISSÃO                                */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {!generatedPoa ? (
              <>
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                      Revisão dos Dados da Procuração
                    </CardTitle>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Confira todos os dados antes de gerar o documento e os links de assinatura.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Outorgante */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1">
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          Outorgante (Concedente)
                        </p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {grantor.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {grantor.type.toUpperCase()} • CPF/CNPJ: {grantor.cpf_cnpj}
                        </p>
                        <p className="text-xs text-zinc-500">{grantor.phone} • {grantor.email}</p>
                      </div>

                      {/* Outorgado */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1">
                        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                          Outorgado(a) (Representante)
                        </p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {grantee.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {grantee.type.toUpperCase()} • CPF/CNPJ: {grantee.cpf_cnpj}
                        </p>
                        <p className="text-xs text-zinc-500">{grantee.phone} • {grantee.email}</p>
                      </div>

                      {/* Veículo */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Veículo Objeto do Mandato
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-base font-bold text-zinc-900 dark:text-white">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Ano: {vehicle.year_fab}/{vehicle.year_model} • Cor: {vehicle.color || 'Não informada'} • Combustível: {vehicle.fuel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-mono font-black text-sm">
                              {vehicle.plate.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {vehicle.renavam && (
                          <p className="text-xs text-zinc-400 font-mono mt-1">
                            Renavam: {vehicle.renavam} {vehicle.chassis ? `• Chassi: ${vehicle.chassis}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Validade */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Prazo e Poderes
                        </p>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200">
                          Validade de <span className="font-bold">{validityDays} dias</span> (expira em {calcExpDate()}).
                        </p>
                        {additionalPowers && (
                          <p className="text-xs text-zinc-500 mt-1 italic">
                            Poderes adicionais: {additionalPowers}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        type="button"
                        onClick={handleGeneratePoa}
                        disabled={generating}
                        className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-xl text-sm gap-2 shadow-sm"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Emitindo Procuração...
                          </>
                        ) : (
                          <>
                            <Scale className="h-4 w-4" />
                            Emitir Procuração Agora
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* TELA DE SUCESSO DA PROCURAÇÃO */
              <Card className="rounded-2xl border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-xs">
                <CardContent className="p-6 sm:p-8 text-center space-y-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Emitida com Sucesso
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-2">
                      Procuração Nº {generatedPoa.number} Pronta!
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {vehicle.brand} {vehicle.model} ({vehicle.plate.toUpperCase()})
                    </p>
                  </div>

                  {/* Opções de Ação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    <a
                      href={`/api/contracts/${generatedPoa.id}/pdf?print=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full h-11 text-xs font-bold rounded-xl gap-2 dark:border-zinc-700"
                      >
                        <Printer className="h-4 w-4" />
                        PDF para Imprimir (Física)
                      </Button>
                    </a>

                    <a
                      href={`/api/contracts/${generatedPoa.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full h-11 text-xs font-bold rounded-xl gap-2 dark:border-zinc-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visualizar PDF Digital
                      </Button>
                    </a>
                  </div>

                  {/* Links de Assinatura Online */}
                  {generatedPoa.signers && (
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-3 max-w-lg mx-auto">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        Link de Assinatura do Outorgante:
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={generatedPoa.signers.grantorSigningUrl || generatedPoa.signers.buyerSigningUrl}
                          className="text-xs font-mono h-9 rounded-xl dark:bg-zinc-800"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            copySigningLink(
                              generatedPoa.signers.grantorSigningUrl ||
                                generatedPoa.signers.buyerSigningUrl
                            )
                          }
                          className="rounded-xl h-9 text-xs gap-1 shrink-0"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedLink ? 'Copiado' : 'Copiar'}
                        </Button>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Olá! Segue o link seguro para assinatura da Procuração do veículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate}): ${
                              generatedPoa.signers.grantorSigningUrl || generatedPoa.signers.buyerSigningUrl
                            }`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 h-9"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      onClick={() => router.push(`/${slug}/admin/contratos`)}
                      variant="ghost"
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                      Voltar ao Painel de Contratos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Botões de Navegação Inferiores (Sticky Bottom Bar no Mobile) */}
      {!generatedPoa && (
        <div className="sticky bottom-0 z-30 bg-surface-1/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-3 sm:py-4 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-lg sm:shadow-none">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? () => router.push(`/${slug}/admin/contratos`) : handleBack}
            className="rounded-xl text-xs sm:text-sm h-11 px-4 gap-1.5 dark:border-zinc-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 rounded-xl text-xs sm:text-sm font-bold gap-1.5 h-11 px-6"
            >
              Avançar
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGeneratePoa}
              disabled={generating}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 rounded-xl text-xs sm:text-sm font-bold gap-1.5 h-11 px-6"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              Concluir e Emitir
            </Button>
          )}
        </div>
      )}

      {/* MODAL: SELEÇÃO DE VEÍCULO DO ESTOQUE (BOTTOM SHEET NO MOBILE) */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-4 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Car className="h-4 w-4 text-indigo-500" />
                Carregar Veículo do Estoque
              </h3>
              <button
                onClick={() => setStockModalOpen(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Buscar por modelo, marca ou ano..."
                  className="pl-9 rounded-xl text-xs dark:bg-zinc-800"
                />
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {vehicles
                .filter(
                  (v) =>
                    !stockSearch ||
                    v.title.toLowerCase().includes(stockSearch.toLowerCase()) ||
                    (v.brand && v.brand.toLowerCase().includes(stockSearch.toLowerCase()))
                )
                .map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectFromStock(v)}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{v.title}</p>
                      <p className="text-[10px] text-zinc-400">
                        {v.brand} • Ano: {v.year} • {v.fuel || 'Flex'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-indigo-600 font-bold">
                      Selecionar
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFERÊNCIA DE DADOS EXTRAÍDOS DO CRLV (FASE 3) */}
      {crlvModalOpen && crlvData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  Conferir Dados Lidos do CRLV
                </h3>
                <p className="text-[11px] text-zinc-500">{crlvFileName}</p>
              </div>
              <button
                onClick={() => setCrlvModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 flex-1 text-xs">
              {crlvData.has_alienacao && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 flex items-start gap-2.5">
                  <AlertOctagon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      Atenção: Gravame / Alienação Fiduciária Detectada
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      {crlvData.alienacao_details ||
                        'O veículo possui anotação de alienação fiduciária no CRLV.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Marca / Modelo:</span>
                  <p className="font-bold text-zinc-900 dark:text-white">{crlvData.brand_model || 'Não identificado'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Placa:</span>
                  <p className="font-bold text-zinc-900 dark:text-white font-mono">{crlvData.plate || 'Não identificada'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Renavam:</span>
                  <p className="font-mono text-zinc-800 dark:text-zinc-200">{crlvData.renavam || 'Não identificado'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Chassi:</span>
                  <p className="font-mono text-zinc-800 dark:text-zinc-200 text-[10px]">{crlvData.chassis || 'Não identificado'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Ano Fab./Mod.:</span>
                  <p className="text-zinc-800 dark:text-zinc-200">{crlvData.year_fab}/{crlvData.year_model}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Cor / Combustível:</span>
                  <p className="text-zinc-800 dark:text-zinc-200">{crlvData.color} • {crlvData.fuel}</p>
                </div>
              </div>

              {crlvData.owner_name && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase">
                      Proprietário no CRLV
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fillOwnerAsGrantor}
                        onChange={(e) => setFillOwnerAsGrantor(e.target.checked)}
                        className="rounded"
                      />
                      Preencher como Outorgante
                    </label>
                  </div>
                  <p className="font-bold text-zinc-900 dark:text-white">{crlvData.owner_name}</p>
                  {crlvData.owner_cpf_cnpj && (
                    <p className="text-zinc-500 font-mono text-[11px]">
                      CPF/CNPJ: {crlvData.owner_cpf_cnpj}
                    </p>
                  )}
                </div>
              )}

            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCrlvModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleApplyCrlvData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Confirmar e Importar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
