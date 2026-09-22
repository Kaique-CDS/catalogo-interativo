'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Loader2, Car, Check, Hash, Eye, EyeOff, Sparkles, Lock, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'
import { generateSKU } from '@/lib/sku'
import { generateWithGemini, buildVehicleDescriptionPrompt, getGeminiApiKey } from '@/lib/gemini'

const COMMON_FEATURES = [
  'Ar-condicionado',
  'Direção Elétrica/Hidráulica',
  'Câmbio Automático',
  'Teto Solar',
  'Bancos em Couro',
  'Central Multimídia',
  'Câmera de Ré / Sensor',
  'Freios ABS / Airbags',
  'Faróis de LED',
  'Piloto Automático',
  'Chave Presencial / Start-Stop',
  'Painel 100% Digital',
  'Garantia de Fábrica',
  'Laudo Cautelar Aprovado',
  'Único Dono',
  'IPVA Pago',
]

const vehicleSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().min(1950).max(new Date().getFullYear() + 2),
  mileage: z.coerce.number().min(0),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que zero'),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  plate_end: z.string().max(2).optional(),
  description: z.string().min(10, 'Descrição é obrigatória (mín. 10 caracteres)').max(500, 'Descrição deve ter no máximo 500 caracteres'),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface Props { slug: string; storeId: string; vehicle?: Vehicle }

export default function VehicleForm({ slug, storeId, vehicle }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!vehicle

  const [images, setImages] = useState<string[]>(vehicle?.images ?? [])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(vehicle?.features ?? [])
  const [fuel, setFuel] = useState<string>(vehicle?.fuel ?? 'Flex')
  const [transmission, setTransmission] = useState<string>(vehicle?.transmission ?? 'Automático')
  const [isActive, setIsActive] = useState<boolean>(vehicle?.is_active ?? true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sku, setSku] = useState<string>(vehicle?.sku ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [descMode, setDescMode] = useState<'manual' | 'ai'>('manual')

  // Auto-generate SKU for new vehicles on mount
  useEffect(() => {
    if (!isEditing && !sku) {
      setSku(generateSKU())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { register, handleSubmit, formState: { errors }, getValues, setValue, watch } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle ? {
      title: vehicle.title,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      price: vehicle.price,
      fuel: vehicle.fuel ?? 'Flex',
      transmission: vehicle.transmission ?? 'Automático',
      color: vehicle.color ?? '',
      plate_end: vehicle.plate_end ?? '',
      description: vehicle.description ?? '',
    } : {
      fuel: 'Flex',
      transmission: 'Automático',
    },
  })

  // Monitoramento reativo das especificações do carro para desbloqueio da I.A
  const watchedValues = watch()
  const titleVal = (watchedValues.title || '').trim()
  const brandVal = (watchedValues.brand || '').trim()
  const modelVal = (watchedValues.model || '').trim()
  const yearVal = watchedValues.year
  const mileageVal = watchedValues.mileage
  const priceVal = watchedValues.price
  const colorVal = (watchedValues.color || '').trim()

  const missingFields: string[] = []
  if (!titleVal) missingFields.push('Título')
  if (!brandVal) missingFields.push('Marca')
  if (!modelVal) missingFields.push('Modelo')
  if (!yearVal) missingFields.push('Ano')
  if (mileageVal === undefined || mileageVal === null || String(mileageVal).trim() === '') missingFields.push('Km')
  if (!priceVal || Number(priceVal) <= 0) missingFields.push('Preço')
  if (!colorVal) missingFields.push('Cor')

  const isFormComplete = missingFields.length === 0

  const toggleFeature = (item: string) => {
    setSelectedFeatures(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    )
  }

  const generateDescription = async () => {
    if (!isFormComplete) {
      toast.error(`Preencha todos os campos obrigatórios antes de gerar a legenda com IA: ${missingFields.join(', ')}.`, {
        duration: 5000,
      })
      return
    }

    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      toast.error('Chave do Gemini não configurada.')
      return
    }

    setAiLoading(true)
    try {
      const prompt = buildVehicleDescriptionPrompt({
        title: titleVal,
        brand: brandVal,
        model: modelVal,
        year: yearVal,
        mileage: mileageVal,
        price: priceVal,
        fuel,
        transmission,
        color: colorVal,
        features: selectedFeatures,
      })
      const result = await generateWithGemini(prompt)
      setValue('description', result, { shouldValidate: true })
      toast.success('Legenda gerada com sucesso pela IA!')
    } catch (err) {
      toast.error('Erro ao gerar descrição com IA. Verifique sua chave do Gemini.')
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    const newUrls: string[] = []

    for (const file of files) {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        newUrls.push(URL.createObjectURL(file))
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error } = await supabase.storage.from('vehicles').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('vehicles').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }
    setImages(prev => [...prev, ...newUrls])
    setUploading(false)
    if (newUrls.length > 0) toast.success('Fotos enviadas com sucesso!')
  }

  const onSubmit = async (data: VehicleFormData) => {
    setSaving(true)
    const payload = {
      ...data,
      sku: sku || generateSKU(),
      fuel,
      transmission,
      is_active: isActive,
      badge: null,
      features: selectedFeatures,
      store_id: storeId,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      toast.success(isEditing ? 'Veículo atualizado (Modo Demo)!' : 'Veículo cadastrado (Modo Demo)!')
      router.push(`/${slug}/admin/estoque`)
      return
    }

    if (isEditing) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      if (error) { toast.error('Erro ao salvar alterações'); setSaving(false); return }
      toast.success('Veículo atualizado com sucesso!')
    } else {
      const { error } = await supabase.from('vehicles').insert(payload)
      if (error) { toast.error('Erro ao cadastrar o veículo'); setSaving(false); return }
      toast.success('Veículo adicionado ao catálogo!')
    }
    router.push(`/${slug}/admin/estoque`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl pb-12">
      {/* 1. Fotos */}
      <Card className="rounded-2xl border-zinc-200/80 shadow-xs">
        <CardContent className="pt-6">
          <Label className="text-xs font-bold text-zinc-900 block mb-2">Fotos do Veículo (Capa e Galeria)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl bg-zinc-100 overflow-hidden group border border-zinc-200/80">
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Foto Principal
                  </span>
                )}
              </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 cursor-pointer bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-zinc-500 mb-1" />
                  <span className="text-xs font-medium text-zinc-600">Adicionar fotos</span>
                  <span className="text-[10px] text-zinc-400">JPG, PNG ou WebP</span>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Informações Principais */}
      <Card className="rounded-2xl border-zinc-200/80 shadow-xs">
        <CardContent className="pt-6 space-y-4">
          {/* SKU read-only */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Hash className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Código SKU (gerado automaticamente)
              </span>
              <span className="font-mono text-sm font-bold text-blue-800">{sku || '—'}</span>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setSku(generateSKU())}
                className="text-[10px] text-blue-500 hover:text-blue-700 underline"
              >
                Gerar novo
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700">Título do Anúncio *</Label>
            <Input id="title" placeholder="Ex: Honda Civic Touring 1.5 Turbo - Único Dono / Teto Solar" className="text-sm rounded-xl" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold text-zinc-700">Marca *</Label>
              <Input id="brand" placeholder="Ex: Honda, Toyota, BMW" className="text-sm rounded-xl" {...register('brand')} />
              {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-semibold text-zinc-700">Modelo *</Label>
              <Input id="model" placeholder="Ex: Civic, Corolla, X1" className="text-sm rounded-xl" {...register('model')} />
              {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-xs font-semibold text-zinc-700">Ano Modelo *</Label>
              <Input id="year" type="number" placeholder="2023" className="text-sm rounded-xl" {...register('year')} />
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage" className="text-xs font-semibold text-zinc-700">Km Rodados *</Label>
              <Input id="mileage" type="number" placeholder="32000" className="text-sm rounded-xl" {...register('mileage')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold text-zinc-700">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" placeholder="129900" className="text-sm rounded-xl font-bold text-zinc-900" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plate_end" className="text-xs font-semibold text-zinc-700">Final da Placa</Label>
              <Input id="plate_end" placeholder="Ex: 8" maxLength={2} className="text-sm rounded-xl" {...register('plate_end')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Câmbio</Label>
              <Select value={transmission} onValueChange={setTransmission}>
                <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder="Câmbio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automático">Automático</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                  <SelectItem value="Automatizado / Dupla Embreagem">Automatizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Combustível</Label>
              <Select value={fuel} onValueChange={setFuel}>
                <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder="Combustível" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flex">Flex (Álcool/Gasolina)</SelectItem>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                  <SelectItem value="Elétrico">100% Elétrico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs font-semibold text-zinc-700">Cor</Label>
              <Input id="color" placeholder="Ex: Branco Pérola, Preto" className="text-sm rounded-xl" {...register('color')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Opcionais e Diferenciais */}
      <Card className="rounded-2xl border-zinc-200/80 shadow-xs">
        <CardContent className="pt-6">
          <Label className="text-xs font-bold text-zinc-900 block mb-1">Opcionais & Diferenciais Rápidos</Label>
          <p className="text-[11px] text-zinc-400 mb-3">Selecione os itens que mais valorizam o veículo</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_FEATURES.map((feature) => {
              const isSelected = selectedFeatures.includes(feature)
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-green-400" />}
                  {feature}
                </button>
              )
            })}
          </div>

          {/* Balão Moderno de Descrição com Abas (Manual vs I.A) */}
          <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white p-4 sm:p-5 shadow-xs">
            {/* Cabeçalho do Balão com Seletor de Modo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-200/70">
              <div>
                <Label htmlFor="description" className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>Descrição do Veículo</span>
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Escolha como deseja compor a legenda do anúncio deste carro:
                </p>
              </div>

              {/* Segmented Switcher (2 opções: Manual ou I.A) */}
              <div className="inline-flex p-1 bg-zinc-200/70 rounded-xl gap-1 self-start sm:self-auto border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setDescMode('manual')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    descMode === 'manual'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Fazer Manualmente
                </button>

                <button
                  type="button"
                  onClick={() => setDescMode('ai')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    descMode === 'ai'
                      ? isFormComplete
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : isFormComplete
                        ? 'text-purple-700 hover:text-purple-900'
                        : 'text-zinc-600 hover:text-zinc-800'
                  }`}
                >
                  {isFormComplete ? (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                  <span>Gerar com I.A</span>
                  {!isFormComplete && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-700 text-zinc-200 rounded font-medium ml-0.5">
                      Bloqueado
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Conteúdo Interno do Balão */}
            <div className="pt-3.5 space-y-3">
              {descMode === 'manual' ? (
                /* MODO MANUAL */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                      <Edit3 className="h-3.5 w-3.5 text-zinc-500" /> Escreva livremente o texto do seu anúncio:
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {(watchedValues.description || '').length}/500 carac.
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Ex: Carro impecável, único dono, todas as revisões feitas em concessionária, laudo cautelar 100% aprovado, pneus novos e sem detalhes."
                    rows={4}
                    maxLength={500}
                    className="text-sm rounded-xl bg-white border-zinc-200 focus:border-zinc-900 transition-colors"
                    {...register('description')}
                  />
                </div>
              ) : (
                /* MODO I.A */
                <div className="space-y-3">
                  {!isFormComplete ? (
                    /* ESTADO BLOQUEADO */
                    <div className="rounded-xl border border-dashed border-amber-300/80 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/60 p-3.5 text-zinc-800">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-300/60 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                              Gerador com I.A Bloqueado
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                              Economia de Tokens
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 leading-relaxed">
                            Para economizar tokens e gerar uma legenda altamente precisa para este carro, preencha todos os campos obrigatórios primeiro:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {missingFields.map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/70 border border-amber-300/80 text-[11px] font-semibold text-amber-900"
                              >
                                ⚠️ {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botão de IA Bloqueado dentro do balão */}
                      <div className="mt-3 pt-3 border-t border-amber-200/60">
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-200/80 text-zinc-400 font-semibold text-xs border border-zinc-300/70 cursor-not-allowed shadow-inner"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Preencha os dados acima para desbloquear a geração com I.A
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ESTADO DESBLOQUEADO / PRONTO */
                    <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-purple-50/40 p-3.5 text-zinc-900">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-950 uppercase tracking-wide">
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> I.A Pronta para Gerar
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                              ✓ Especificações Completas
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600">
                            A I.A filtrará apenas os dados preenchidos deste veículo para gastar o mínimo de tokens:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                              🚗 {brandVal} {modelVal}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                              📅 {yearVal}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                              🛣️ {Number(mileageVal).toLocaleString('pt-BR')} km
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                              💰 R$ {Number(priceVal).toLocaleString('pt-BR')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                              🎨 {colorVal}
                            </span>
                            {selectedFeatures.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-white/90 border border-purple-200 text-purple-900 font-medium">
                                ⚙️ {selectedFeatures.length} opcionais
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Gerar com IA DENTRO do balão */}
                        <div className="shrink-0 self-stretch sm:self-center">
                          <button
                            type="button"
                            onClick={generateDescription}
                            disabled={aiLoading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                          >
                            {aiLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-amber-300" />
                            )}
                            {aiLoading ? 'Criando legenda...' : '✨ Gerar Legenda com I.A'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campo de Texto onde a IA insere a descrição */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Texto da Legenda (gerado pela IA ou ajustado por você):
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {(watchedValues.description || '').length}/500 carac.
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder={
                        isFormComplete
                          ? "Clique no botão '✨ Gerar Legenda com I.A' acima para criar o texto automaticamente..."
                          : "Preencha as especificações para liberar o botão de geração com I.A..."
                      }
                      rows={4}
                      maxLength={500}
                      className="text-sm rounded-xl bg-white border-zinc-200 focus:border-purple-500 transition-colors"
                      {...register('description')}
                    />
                  </div>
                </div>
              )}

              {/* Dica de rodapé e mensagem de validação */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-zinc-400">
                  Mínimo 10 caracteres. Máximo 500 caracteres para anúncios otimizados.
                </p>
              </div>
              {errors.description && (
                <p className="text-xs text-red-500 font-medium mt-0.5">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Status de Publicação */}
      <Card className="rounded-2xl border-zinc-200/80 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <div className="flex items-center gap-3.5">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  {isActive ? 'Veículo Publicado no Catálogo' : 'Veículo Pausado / Oculto'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isActive
                    ? 'Disponível e visível para todos os visitantes da sua vitrine.'
                    : 'Oculto do catálogo online. Não aparece para os compradores.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold shadow-sm">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEditing ? 'Salvar Alterações' : 'Publicar Veículo no Catálogo'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${slug}/admin/estoque`)}
          className="rounded-xl text-sm"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}