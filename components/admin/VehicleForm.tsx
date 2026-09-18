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
import { Upload, X, Loader2, Car, Check, Hash, Eye, EyeOff, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'
import { generateSKU } from '@/lib/sku'
import { generateWithGemini, buildVehicleDescriptionPrompt } from '@/lib/gemini'

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
  description: z.string().min(10, 'Descrição é obrigatória (mín. 10 caracteres)'),
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

  // Auto-generate SKU for new vehicles on mount
  useEffect(() => {
    if (!isEditing && !sku) {
      setSku(generateSKU())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { register, handleSubmit, formState: { errors }, getValues, setValue } = useForm<VehicleFormData>({
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

  const toggleFeature = (item: string) => {
    setSelectedFeatures(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    )
  }

  const generateDescription = async () => {
    const values = getValues()
    if (!values.title && !values.brand) {
      toast.error('Preencha pelo menos o titulo e a marca antes de gerar a descricao.')
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      toast.error('Chave do Gemini nao configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no .env.local')
      return
    }
    setAiLoading(true)
    try {
      const prompt = buildVehicleDescriptionPrompt({
        title: values.title || '',
        brand: values.brand || '',
        model: values.model || '',
        year: values.year || new Date().getFullYear(),
        mileage: values.mileage || 0,
        fuel,
        transmission,
        features: selectedFeatures,
      })
      const result = await generateWithGemini(prompt)
      setValue('description', result)
      toast.success('Descricao gerada com sucesso!')
    } catch (err) {
      toast.error('Erro ao gerar descricao. Verifique sua chave do Gemini.')
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

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">
                Descrição do Veículo <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {aiLoading ? 'Gerando com IA...' : '✨ Gerar com IA'}
              </button>
            </div>
            <Textarea
              id="description"
              placeholder="Ex: Todas as revisões feitas em concessionária, pneus Pirelli novos, laudo Dekra 100% aprovado, sem retoques. Carro em excelente estado, único dono."
              rows={4}
              className="text-sm rounded-xl"
              {...register('description')}
            />
            <p className="text-[10px] text-zinc-400">Mín. 10 caracteres. Uma boa descrição aumenta as chances de venda!</p>
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
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