'use client'

import { useState } from 'react'
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
import { Upload, X, Loader2, Car, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

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
  'Rodas de Liga Leve',
  'Piloto Automático',
  'Garantia de Fábrica',
  'Único Dono',
  'IPVA Pago',
  'Laudo Cautelar Aprovado'
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
  badge: z.string().optional(),
  description: z.string().optional(),
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
  const [badge, setBadge] = useState<string>(vehicle?.badge ?? 'Nenhum')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<VehicleFormData>({
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
      badge: vehicle.badge ?? '',
      description: vehicle.description ?? '',
    } : {
      fuel: 'Flex',
      transmission: 'Automático',
      badge: '',
    },
  })

  const toggleFeature = (item: string) => {
    setSelectedFeatures(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('vehicles').upload(path, file, { upsert: true })
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue }
      const { data } = supabase.storage.from('vehicles').getPublicUrl(path)
      newUrls.push(data.publicUrl)
    }
    setImages(prev => [...prev, ...newUrls])
    setUploading(false)
    if (newUrls.length > 0) toast.success('Fotos enviadas com sucesso!')
  }

  const onSubmit = async (data: VehicleFormData) => {
    setSaving(true)
    const payload = {
      ...data,
      fuel,
      transmission,
      badge: badge === 'Nenhum' ? null : badge,
      features: selectedFeatures,
      store_id: storeId,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      toast.success(isEditing ? 'Veículo atualizado (Modo Demo)!' : 'Veículo adicionado (Modo Demo)!')
      router.push(`/${slug}/admin/estoque`)
      return
    }

    if (isEditing) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      if (error) { toast.error('Erro ao salvar alterações'); setSaving(false); return }
      toast.success('Veículo atualizado!')
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm font-bold text-zinc-900 block">Fotos do Veículo</Label>
              <p className="text-xs text-zinc-500">A primeira foto será o destaque da vitrine.</p>
            </div>
            <span className="text-xs font-semibold text-zinc-400">{images.length} adicionada(s)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {images.map((url, index) => (
              <div key={url} className="relative aspect-video rounded-xl overflow-hidden border bg-zinc-100 group">
                <Image src={url} alt="Foto" fill className="object-cover" sizes="200px" />
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 bg-zinc-900/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages(p => p.filter(i => i !== url))}
                  className="absolute top-1 right-1 h-6 w-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <label className="aspect-video rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-50 transition-all">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
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
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700">Título do Anúncio *</Label>
            <Input id="title" placeholder="Ex: Honda Civic Touring 1.5 Turbo - Único Dono / Teto Solar" className="text-sm rounded-xl" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Selo Promocional</Label>
              <Select value={badge} onValueChange={setBadge}>
                <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder="Selecione selo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nenhum">Sem selo</SelectItem>
                  <SelectItem value="Imperdível 🔥">Imperdível 🔥</SelectItem>
                  <SelectItem value="Único Dono ✨">Único Dono ✨</SelectItem>
                  <SelectItem value="Oportunidade 💎">Oportunidade 💎</SelectItem>
                  <SelectItem value="Abaixo da Fipe 📉">Abaixo da Fipe 📉</SelectItem>
                  <SelectItem value="Garantia de Fábrica 🛡️">Garantia de Fábrica 🛡️</SelectItem>
                </SelectContent>
              </Select>
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
          <p className="text-xs text-zinc-500 mb-3">Selecione os itens presentes no carro para destacar ao cliente na vitrine e no WhatsApp.</p>

          <div className="flex flex-wrap gap-2">
            {COMMON_FEATURES.map((feature) => {
              const isSelected = selectedFeatures.includes(feature)
              return (
                <button
                  type="button"
                  key={feature}
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
            <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">Observações Extras / Laudo / Histórico</Label>
            <Textarea
              id="description"
              placeholder="Ex: Todas as revisões feitas em concessionária, pneus Pirelli novos, laudo Dekra 100% aprovado, sem retoques..."
              rows={3}
              className="text-sm rounded-xl"
              {...register('description')}
            />
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