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
import { Upload, X, Loader2, Car, Check, Hash, Eye, EyeOff, Sparkles, Lock, Edit3, Star } from 'lucide-react'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import type { Vehicle } from '@/lib/supabase/types'
import { generateSKU } from '@/lib/sku'
import { generateWithGemini, buildVehicleDescriptionPrompt, getGeminiApiKey } from '@/lib/gemini'

export interface VehiclePhotoItem {
  url: string
  public_id?: string | null
  is_capa?: boolean
}

interface UploadingPhoto {
  id: string
  previewUrl: string
  progress: number
  stage: 'optimizing' | 'uploading'
  name: string
}

function isValidImageFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return (
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/png' ||
    type === 'image/webp' ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type.startsWith('image/') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

function isHeicFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

async function prepareImageForCompression(file: File): Promise<File> {
  if (!isHeicFile(file)) return file
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85,
    })
    const blob = Array.isArray(converted) ? converted[0] : converted
    const newName = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    console.warn('Fallback heic2any não executado; tentando browser-image-compression diretamente:', err)
    return file
  }
}

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
  year: z.coerce.number().min(1950, 'Ano inválido').max(2030, 'Ano inválido'),
  mileage: z.coerce.number().min(0, 'Quilometragem inválida'),
  price: z.coerce.number().min(0, 'Preço inválido'),
  fuel: z.string().optional().nullable(),
  transmission: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  plate_end: z.string().max(4).optional().nullable(),
  description: z.string().min(10, 'Descrição é obrigatória (mín. 10 caracteres)').max(500, 'Descrição deve ter no máximo 500 caracteres'),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface Props { slug: string; storeId: string; vehicle?: Vehicle }

export default function VehicleForm({ slug, storeId, vehicle }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!vehicle

  const [vehicleId] = useState<string>(() => vehicle?.id || crypto.randomUUID())
  const [photos, setPhotos] = useState<VehiclePhotoItem[]>(() => {
    if (!vehicle) return []
    const rawFotos = (vehicle as any).fotos
    if (Array.isArray(rawFotos) && rawFotos.length > 0) {
      return rawFotos
        .map((f: any, idx: number) => ({
          url: typeof f === 'string' ? f : f?.url || '',
          public_id: typeof f === 'object' && f?.public_id ? String(f.public_id) : null,
          is_capa: typeof f === 'object' && typeof f?.is_capa === 'boolean' ? f.is_capa : idx === 0,
        }))
        .filter((item: VehiclePhotoItem) => Boolean(item.url))
    }
    if (Array.isArray(vehicle.images)) {
      return vehicle.images.map((url, idx) => ({
        url,
        public_id: null,
        is_capa: idx === 0,
      }))
    }
    return []
  })
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([])
  const [isDragging, setIsDragging] = useState(false)
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

  const updateUploadItem = (
    itemId: string,
    patch: Partial<Pick<UploadingPhoto, 'progress' | 'stage'>>
  ) => {
    setUploadingPhotos((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    )
  }

  const uploadToServerWithProgress = (
    fileToSend: File,
    marca: string,
    idVeiculo: string,
    onProgress: (pct: number) => void
  ): Promise<{ secure_url: string; public_id?: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload-foto')

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && ev.total > 0) {
          const pct = Math.round((ev.loaded / ev.total) * 100)
          onProgress(pct)
        }
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
            resolve({
              secure_url: data.secure_url,
              public_id: data.public_id,
            })
          } else {
            reject(new Error(data.error || 'Falha ao enviar imagem para o Cloudinary.'))
          }
        } catch {
          reject(new Error('Resposta inválida do servidor de upload.'))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Falha de conexão durante o upload da foto.'))
      }

      const formData = new FormData()
      formData.append('file', fileToSend)
      formData.append('marca', marca)
      formData.append('id_veiculo', idVeiculo)
      xhr.send(formData)
    })
  }

  const processSelectedFiles = async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return

    const currentTotal = photos.length + uploadingPhotos.length
    if (currentTotal >= 10) {
      toast.error('Limite de 10 fotos por veículo atingido. Remova uma foto para adicionar outra.')
      return
    }

    // Aceita qualquer tamanho de arquivo de imagem, validando os formatos permitidos
    const validFiles: File[] = []
    for (const file of rawFiles) {
      if (!isValidImageFile(file)) {
        toast.error(`Arquivo "${file.name}" recusado: envie imagens em JPG, PNG, WEBP ou HEIC/HEIF.`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    let filesToProcess = validFiles
    if (currentTotal + filesToProcess.length > 10) {
      const allowed = 10 - currentTotal
      filesToProcess = filesToProcess.slice(0, allowed)
      toast.warning(`Apenas ${allowed} foto(s) adicionada(s) para não ultrapassar o limite de 10.`)
    }

    const newUploadItems: UploadingPhoto[] = filesToProcess.map((f) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(f),
      progress: 5,
      stage: 'optimizing',
      name: f.name,
    }))

    setUploadingPhotos((prev) => [...prev, ...newUploadItems])
    setUploading(true)

    const currentBrand = (brandVal || getValues('brand') || 'sem-marca').trim()
    let successCount = 0

    await Promise.all(
      filesToProcess.map(async (file, idx) => {
        const item = newUploadItems[idx]
        try {
          // 1. Converter HEIC/HEIF se necessário (ex: fotos de iPhone)
          const readyFile = await prepareImageForCompression(file)

          // 2. Compressão robusta no client via Web Worker (máx 1920px, qualidade ~0.8, meta ~300KB)
          const compressedBlob = await imageCompression(readyFile, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1920,
            initialQuality: 0.8,
            useWebWorker: true,
            fileType: 'image/jpeg',
            onProgress: (p: number) => {
              updateUploadItem(item.id, {
                progress: Math.max(5, Math.min(50, Math.round(p * 0.5))),
                stage: 'optimizing',
              })
            },
          })

          const cleanName = (readyFile.name || 'foto.jpg').replace(/\.[^.]+$/, '') + '.jpg'
          const compressedFile = new File([compressedBlob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          // 3. Upload assinado via API route (/api/upload-foto)
          updateUploadItem(item.id, { progress: 55, stage: 'uploading' })

          const uploadResult = await uploadToServerWithProgress(
            compressedFile,
            currentBrand,
            vehicleId,
            (uploadPct) => {
              const combined = 50 + Math.round(uploadPct * 0.5)
              updateUploadItem(item.id, {
                progress: Math.min(99, combined),
                stage: 'uploading',
              })
            }
          )

          setPhotos((prev) =>
            prev.length < 10
              ? [
                  ...prev,
                  {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id || null,
                    is_capa: prev.length === 0,
                  },
                ]
              : prev
          )
          successCount += 1
        } catch (err: any) {
          console.error('Erro no processamento/upload da foto:', err)
          toast.error(err?.message || `Falha ao processar "${file.name}".`)
        } finally {
          URL.revokeObjectURL(item.previewUrl)
          setUploadingPhotos((prev) => prev.filter((u) => u.id !== item.id))
        }
      })
    )

    setUploading(false)
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? 'Foto otimizada e enviada com sucesso!'
          : `${successCount} fotos otimizadas e enviadas com sucesso!`
      )
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    await processSelectedFiles(files)
  }

  const handleDropFiles = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer?.files ?? [])
    await processSelectedFiles(files)
  }

  const handleSetCover = (index: number) => {
    if (index === 0) return
    setPhotos((prev) => {
      const selected = prev[index]
      if (!selected) return prev
      const rest = prev.filter((_, i) => i !== index)
      return [
        { ...selected, is_capa: true },
        ...rest.map((p) => ({ ...p, is_capa: false })),
      ]
    })
    toast.success('Foto definida como capa do veículo!')
  }

  const onSubmit = async (data: VehicleFormData) => {
    if (uploading || uploadingPhotos.length > 0) {
      toast.warning('Aguarde o término do envio das fotos antes de salvar.')
      return
    }

    setSaving(true)
    const finalPhotos =
      photos.length > 0
        ? photos
        : [
            {
              url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
              public_id: null,
              is_capa: true,
            },
          ]

    const finalImages = finalPhotos.map((p) => p.url)
    const fotosPayload = finalPhotos.map((p, idx) => ({
      url: p.url,
      public_id: p.public_id || null,
      is_capa: idx === 0,
    }))

    const payload = {
      ...data,
      id: vehicleId,
      sku: sku || generateSKU(),
      fuel,
      transmission,
      is_active: isActive,
      badge: null,
      features: selectedFeatures,
      slug,
      images: finalImages,
      fotos: fotosPayload,
      fotos_urls: finalImages,
      foto_capa_url: finalImages[0] || null,
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/vehicles/${vehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao salvar alterações')
        }
        toast.success('Veículo atualizado com sucesso!')
      } else {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao cadastrar o veículo')
        }
        toast.success('Veículo adicionado ao catálogo!')
      }
      router.push(`/${slug}/admin/estoque`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado')
      setSaving(false)
    }
  }

  const onInvalid = (formErrors: Record<string, any>) => {
    const firstError = Object.values(formErrors)[0]?.message
    toast.error(firstError ? String(firstError) : 'Verifique os campos obrigatórios do formulário.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 max-w-3xl pb-12">
      {/* 1. Fotos */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block">
              Fotos do Veículo (Capa e Galeria)
            </Label>
            <span className={`text-[11px] font-bold ${
              photos.length >= 10
                ? 'text-rose-500'
                : photos.length >= 8
                ? 'text-amber-500'
                : 'text-zinc-400'
            }`}>
              {photos.length}/10 fotos
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (photos.length < 10) setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(false)
            }}
            onDrop={handleDropFiles}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {photos.map((photo, i) => (
              <div
                key={`${photo.url}-${i}`}
                className={`relative aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden group border transition-all ${
                  i === 0
                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Image src={photo.url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 h-7 w-7 flex items-center justify-center bg-black/75 hover:bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md"
                  aria-label="Remover foto"
                  title="Remover foto"
                >
                  <X className="h-4 w-4" />
                </button>

                {i === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-amber-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                    <Star className="h-3 w-3 fill-zinc-950" /> Capa
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(i)}
                    className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-black/75 hover:bg-amber-500 hover:text-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-xs"
                    title="Definir como foto de capa"
                  >
                    <Star className="h-3 w-3" /> Definir Capa
                  </button>
                )}
              </div>
            ))}

            {/* Previews em andamento com barra de progresso individual */}
            {uploadingPhotos.map((item) => (
              <div
                key={item.id}
                className="relative aspect-video rounded-xl bg-zinc-900 overflow-hidden border border-indigo-500/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover opacity-45"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-black/50">
                  <Loader2 className="h-5 w-5 text-white animate-spin mb-1.5" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {item.stage === 'optimizing' ? 'Otimizando imagem...' : 'Enviando...'} {item.progress}%
                  </span>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-200 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <label className={`flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed transition-colors ${
              photos.length >= 10
                ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10 cursor-not-allowed'
                : isDragging
                ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}>
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-5 w-5 text-zinc-400 animate-spin mb-1" />
                  <span className="text-[10px] font-semibold text-zinc-400">Processando...</span>
                </div>
              ) : (
                <>
                  <Upload className={`h-5 w-5 mb-1 ${photos.length >= 10 ? 'text-rose-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span className={`text-xs font-medium text-center px-2 ${photos.length >= 10 ? 'text-rose-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {photos.length >= 10 ? 'Limite atingido' : 'Adicionar ou arrastar fotos'}
                  </span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${
                    photos.length >= 10
                      ? 'text-rose-500'
                      : photos.length >= 8
                      ? 'text-amber-500'
                      : 'text-zinc-400'
                  }`}>
                    {photos.length}/10 fotos
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={photos.length >= 10}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Informações Principais */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-xs">
        <CardContent className="pt-6 space-y-4">
          {/* SKU read-only */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <Hash className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Código SKU (gerado automaticamente)
              </span>
              <span className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300">{sku || '—'}</span>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setSku(generateSKU())}
                className="text-[10px] text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Gerar novo
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Título do Anúncio *</Label>
            <Input id="title" placeholder="Ex: Honda Civic Touring 1.5 Turbo - Único Dono / Teto Solar" className="text-sm rounded-xl" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Marca *</Label>
              <Input id="brand" placeholder="Ex: Honda, Toyota, BMW" className="text-sm rounded-xl" {...register('brand')} />
              {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Modelo *</Label>
              <Input id="model" placeholder="Ex: Civic, Corolla, X1" className="text-sm rounded-xl" {...register('model')} />
              {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ano Modelo *</Label>
              <Input id="year" type="number" placeholder="2023" className="text-sm rounded-xl" {...register('year')} />
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Km Rodados *</Label>
              <Input id="mileage" type="number" placeholder="32000" className="text-sm rounded-xl" {...register('mileage')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" placeholder="129900" className="text-sm rounded-xl font-bold text-zinc-900 dark:text-zinc-50" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plate_end" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Final da Placa</Label>
              <Input id="plate_end" placeholder="Ex: 8" maxLength={2} className="text-sm rounded-xl" {...register('plate_end')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Câmbio</Label>
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
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Combustível</Label>
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
              <Label htmlFor="color" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cor</Label>
              <Input id="color" placeholder="Ex: Branco Pérola, Preto" className="text-sm rounded-xl" {...register('color')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Opcionais e Diferenciais */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="pt-6">
          <Label className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block mb-1">Opcionais & Diferenciais Rápidos</Label>
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
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-green-400 dark:text-emerald-600" />}
                  {feature}
                </button>
              )
            })}
          </div>

          {/* Balão Moderno de Descrição com Abas (Manual vs I.A) */}
          <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50/80 to-white dark:from-zinc-900/50 dark:to-zinc-900 p-4 sm:p-5 shadow-xs">
            {/* Cabeçalho do Balão com Seletor de Modo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <Label htmlFor="description" className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <span>Descrição do Veículo</span>
                  <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Escolha como deseja compor a legenda do anúncio deste carro:
                </p>
              </div>

              {/* Segmented Switcher (2 opções: Manual ou I.A) */}
              <div className="inline-flex p-1 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-xl gap-1 self-start sm:self-auto border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDescMode('manual')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    descMode === 'manual'
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
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
                        : 'bg-zinc-800 dark:bg-zinc-700 text-zinc-100 shadow-xs'
                      : isFormComplete
                        ? 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {isFormComplete ? (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  )}
                  <span>Gerar com I.A</span>
                  {!isFormComplete && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-700 dark:bg-zinc-800 text-zinc-200 rounded font-medium ml-0.5">
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
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-medium">
                      <Edit3 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" /> Escreva livremente o texto do seu anúncio:
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
                    className="text-sm rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-50 transition-colors"
                    {...register('description')}
                  />
                </div>
              ) : (
                /* MODO I.A */
                <div className="space-y-3">
                  {!isFormComplete ? (
                    /* ESTADO BLOQUEADO */
                    <div className="rounded-xl border border-dashed border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/60 dark:from-amber-950/20 dark:to-amber-900/10 p-3.5 text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-300/60 dark:border-amber-700/50 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-500 mt-0.5">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-400 uppercase tracking-wide">
                              Gerador com I.A Bloqueado
                            </span>
                            <span className="text-[10px] bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                              Economia de Tokens
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 dark:text-amber-200/70 leading-relaxed">
                            Para economizar tokens e gerar uma legenda altamente precisa para este carro, preencha todos os campos obrigatórios primeiro:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {missingFields.map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/30 border border-amber-300/80 dark:border-amber-800/50 text-[11px] font-semibold text-amber-900 dark:text-amber-400"
                              >
                                ⚠️ {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botão de IA Bloqueado dentro do balão */}
                      <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/30">
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 font-semibold text-xs border border-zinc-300/70 dark:border-zinc-700/50 cursor-not-allowed shadow-inner dark:shadow-none"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Preencha os dados acima para desbloquear a geração com I.A
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ESTADO DESBLOQUEADO / PRONTO */
                    <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-purple-50/40 dark:from-purple-950/30 dark:to-indigo-950/20 p-3.5 text-zinc-900 dark:text-zinc-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wide">
                              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> I.A Pronta para Gerar
                            </span>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                              ✓ Especificações Completas
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            A I.A filtrará apenas os dados preenchidos deste veículo para gastar o mínimo de tokens:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
                              🚗 {brandVal} {modelVal}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
                              📅 {yearVal}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
                              🛣️ {Number(mileageVal).toLocaleString('pt-BR')} km
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
                              💰 R$ {Number(priceVal).toLocaleString('pt-BR')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
                              🎨 {colorVal}
                            </span>
                            {selectedFeatures.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-300 font-medium">
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
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
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
                      className="text-sm rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-purple-500 transition-colors"
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
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {isActive ? 'Veículo Publicado no Catálogo' : 'Veículo Pausado / Oculto'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {isActive
                    ? 'Disponível e visível para todos os visitantes da sua vitrine.'
                    : 'Oculto do catálogo online. Não aparece para os compradores.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none px-8 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold shadow-sm">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEditing ? 'Salvar Alterações' : 'Publicar Veículo no Catálogo'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${slug}/admin/estoque`)}
          className="rounded-xl text-sm dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}