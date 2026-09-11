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
import { Upload, X, Loader2, Car } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

const vehicleSchema = z.object({
  title:       z.string().min(3, 'Titulo deve ter ao menos 3 caracteres'),
  brand:       z.string().min(1, 'Marca e obrigatoria'),
  model:       z.string().min(1, 'Modelo e obrigatorio'),
  year:        z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  mileage:     z.coerce.number().min(0),
  price:       z.coerce.number().min(0.01, 'Preco deve ser maior que zero'),
  description: z.string().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface Props { slug: string; storeId: string; vehicle?: Vehicle }

export default function VehicleForm({ slug, storeId, vehicle }: Props) {
  const router    = useRouter()
  const supabase  = createClient()
  const isEditing = !!vehicle

  const [images,    setImages]    = useState<string[]>(vehicle?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle ? {
      title: vehicle.title, brand: vehicle.brand, model: vehicle.model,
      year: vehicle.year, mileage: vehicle.mileage, price: vehicle.price,
      description: vehicle.description ?? '',
    } : {},
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('vehicles').upload(path, file, { upsert: true })
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue }
      const { data } = supabase.storage.from('vehicles').getPublicUrl(path)
      newUrls.push(data.publicUrl)
    }
    setImages((prev) => [...prev, ...newUrls])
    setUploading(false)
    if (newUrls.length > 0) toast.success('Fotos enviadas!')
  }

  const onSubmit = async (data: VehicleFormData) => {
    setSaving(true)
    const payload = { ...data, store_id: storeId, images }
    if (isEditing) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      if (error) { toast.error('Erro ao salvar alteracoes'); setSaving(false); return }
      toast.success('Veiculo atualizado!')
    } else {
      const { error } = await supabase.from('vehicles').insert(payload)
      if (error) { toast.error('Erro ao cadastrar o veiculo'); setSaving(false); return }
      toast.success('Veiculo adicionado ao catalogo!')
    }
    router.push(`/${slug}/admin/estoque`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block">Fotos do veiculo</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {images.map((url) => (
              <div key={url} className="relative aspect-video rounded-lg overflow-hidden border bg-zinc-100">
                <Image src={url} alt="Foto" fill className="object-cover" sizes="150px" />
                <button type="button" onClick={() => setImages((p) => p.filter((i) => i !== url))}
                  className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="aspect-video rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-400" /> : (
                <><Upload className="h-5 w-5 text-zinc-400 mb-1" /><span className="text-xs text-zinc-400">Adicionar</span></>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          {images.length === 0 && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />Adicione fotos (a primeira sera a capa)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titulo do anuncio *</Label>
            <Input id="title" placeholder="Ex: Honda Civic EXL 2022 - IPVA Pago" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Marca *</Label>
              <Input id="brand" placeholder="Honda, Toyota..." {...register('brand')} />
              {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Modelo *</Label>
              <Input id="model" placeholder="Civic, Corolla..." {...register('model')} />
              {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="year">Ano *</Label>
              <Input id="year" type="number" placeholder="2022" {...register('year')} />
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input id="mileage" type="number" placeholder="45000" {...register('mileage')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preco (R$) *</Label>
              <Input id="price" type="number" step="0.01" placeholder="89900" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Detalhes extras</Label>
            <Textarea id="description" placeholder="Opcionais, revisoes, IPVA pago..." rows={4} {...register('description')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar Alteracoes' : 'Adicionar ao Catalogo'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/${slug}/admin/estoque`)}>Cancelar</Button>
      </div>
    </form>
  )
}