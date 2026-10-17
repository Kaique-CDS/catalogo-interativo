'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  Loader2,
  Globe,
  Phone,
  Clock,
  Image as ImageIcon,
  Instagram,
  PhoneCall,
  MessageCircle,
  MapPin,
  Mail,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Monitor,
  Smartphone,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'
import {
  validateStoreAsset,
  getBrowserImageDimensions,
  IMAGE_SPECS,
  type AssetType,
} from '@/lib/image-specs'

const settingsSchema = z.object({
  name:                z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone:               z.string().optional(),
  instagram:           z.string().optional(),
  whatsapp:            z.string().min(10, 'Informe um número de WhatsApp válido (com DDI)'),
  whatsapp_financeiro: z.string().optional(),
  email:               z.string().optional(),
  maps_embed_url:      z.string().optional(),
  opening_hours:       z.string().optional(),
  address:             z.string().optional(),
  slogan:              z.string().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface Props { store: Store; slug: string }

export default function StoreSettingsForm({ store, slug }: Props) {
  const [logoUrl,         setLogoUrl]         = useState<string | null>(store.logo_url)
  const [bannerUrl,       setBannerUrl]       = useState<string | null>(store.banner_url)
  const [bannerMobileUrl, setBannerMobileUrl] = useState<string | null>(store.banner_mobile_url || null)
  const [saving,          setSaving]          = useState(false)

  // Estados de upload e progresso
  const [uploadProgress, setUploadProgress] = useState<Record<AssetType, number | null>>({
    logo: null,
    banner_desktop: null,
    banner_mobile: null,
  })

  // Drag over states
  const [dragActive, setDragActive] = useState<Record<AssetType, boolean>>({
    logo: false,
    banner_desktop: false,
    banner_mobile: false,
  })

  // Modal de confirmação de exclusão
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: AssetType | null
    title: string
  }>({ isOpen: false, type: null, title: '' })
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name:                store.name,
      phone:               store.phone ?? '',
      instagram:           store.instagram ?? '',
      whatsapp:            store.whatsapp,
      whatsapp_financeiro: store.whatsapp_financeiro ?? '',
      email:               store.email ?? '',
      maps_embed_url:      store.maps_embed_url ?? '',
      opening_hours:       store.opening_hours ?? 'Seg a Sex: 09h às 18h',
      address:             store.address ?? '',
      slogan:              store.slogan ?? '',
    },
  })

  const watchedAddress = watch('address')

  // Upload unificado para Cloudinary com validação no cliente e servidor
  const processAssetUpload = async (type: AssetType, file: File) => {
    try {
      // 1. Validação prévia de dimensões no navegador
      const dims = await getBrowserImageDimensions(file)
      const validation = validateStoreAsset(type, dims)
      if (!validation.valid) {
        toast.error(validation.error || 'Arquivo fora das especificações exigidas.')
        return
      }

      setUploadProgress((prev) => ({ ...prev, [type]: 25 }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('slug', slug)

      setUploadProgress((prev) => ({ ...prev, [type]: 60 }))

      const response = await fetch('/api/store-assets/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro no upload para o Cloudinary.')
      }

      setUploadProgress((prev) => ({ ...prev, [type]: 100 }))

      if (type === 'logo') setLogoUrl(data.secure_url)
      else if (type === 'banner_desktop') setBannerUrl(data.secure_url)
      else if (type === 'banner_mobile') setBannerMobileUrl(data.secure_url)

      toast.success(
        `${
          type === 'logo'
            ? 'Logo enviada'
            : type === 'banner_desktop'
            ? 'Banner desktop enviado'
            : 'Banner mobile enviado'
        } com sucesso! Clique em "Salvar Configurações" para gravar.`
      )
    } catch (err: any) {
      toast.error(err.message || 'Falha ao processar upload.')
    } finally {
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: null }))
      }, 600)
    }
  }

  const handleFileInputChange = (type: AssetType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processAssetUpload(type, file)
    e.target.value = ''
  }

  const handleDrop = (type: AssetType) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [type]: false }))
    const file = e.dataTransfer.files?.[0]
    if (file) processAssetUpload(type, file)
  }

  const handleDragOver = (type: AssetType) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [type]: true }))
  }

  const handleDragLeave = (type: AssetType) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [type]: false }))
  }

  // Confirmação de exclusão segura
  const promptDeleteAsset = (type: AssetType, title: string) => {
    setDeleteModal({ isOpen: true, type, title })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.type) return
    const type = deleteModal.type
    setDeleting(true)

    try {
      const currentUrl =
        type === 'logo'
          ? logoUrl
          : type === 'banner_desktop'
          ? bannerUrl
          : bannerMobileUrl

      const response = await fetch('/api/store-assets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          slug,
          asset_type: type,
          current_url: currentUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover imagem.')
      }

      if (type === 'logo') setLogoUrl(null)
      else if (type === 'banner_desktop') setBannerUrl(null)
      else if (type === 'banner_mobile') setBannerMobileUrl(null)

      toast.success('Imagem removida com sucesso!')
      setDeleteModal({ isOpen: false, type: null, title: '' })
    } catch (err: any) {
      toast.error(err.message || 'Falha ao remover imagem.')
    } finally {
      setDeleting(false)
    }
  }

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true)
    try {
      const response = await fetch('/api/store-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          slug,
          name: data.name,
          slogan: data.slogan || null,
          address: data.address || null,
          opening_hours: data.opening_hours || null,
          phone: data.phone || null,
          instagram: data.instagram || null,
          whatsapp: data.whatsapp,
          whatsapp_financeiro: data.whatsapp_financeiro || null,
          email: data.email || null,
          maps_embed_url: data.maps_embed_url || null,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          banner_mobile_url: bannerMobileUrl,
        }),
      })

      const resData = await response.json()
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erro ao salvar as configurações')
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err)
      toast.error(err.message || 'Erro ao salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  const storefrontUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${slug}`
    : `https://seudominio.com/${slug}`

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Vitrine URL */}
        <Card className="border-surface bg-surface-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-heading mb-1.5">
              <Globe className="h-4 w-4 text-brand" />URL da sua vitrine
            </div>
            <p className="text-sm text-brand font-mono font-medium opacity-90">{storefrontUrl}</p>
          </CardContent>
        </Card>

        {/* ── CARD 1: LOGO DA LOJA ── */}
        <Card className="border-surface bg-surface-1">
          <CardHeader className="pb-3 border-b border-surface">
            <CardTitle className="text-sm font-bold text-heading flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-brand" /> 1. Logo da Loja
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">Máx 2 MB</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Preview com fundo xadrez para verificar transparência */}
              <div className="relative h-24 w-24 rounded-2xl border border-surface overflow-hidden shrink-0 flex items-center justify-center bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] [background-size:16px_16px] shadow-xs">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo da Loja"
                    width={96}
                    height={96}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-black text-muted-foreground/60">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Controles de Ação e Drag & Drop */}
              <div className="flex-1 w-full space-y-2.5">
                <div
                  onDragOver={handleDragOver('logo')}
                  onDragLeave={handleDragLeave('logo')}
                  onDrop={handleDrop('logo')}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                    dragActive.logo
                      ? 'border-brand bg-brand/5'
                      : 'border-surface hover:border-brand/50 bg-surface-2/40'
                  }`}
                  onClick={() => document.getElementById('input-logo-file')?.click()}
                >
                  <Upload className="h-4 w-4 text-brand mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">
                    Clique para selecionar ou arraste sua logo aqui
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG com transparência (recomendado), WebP, JPG ou SVG. Mín. 400x400 px.
                  </p>
                  <input
                    id="input-logo-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileInputChange('logo')}
                  />
                </div>

                {uploadProgress.logo !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-brand font-semibold">
                      <span>Enviando logo para o Cloudinary...</span>
                      <span>{uploadProgress.logo}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.logo}%` }}
                      />
                    </div>
                  </div>
                )}

                {logoUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('input-logo-file')?.click()}
                      className="text-xs h-8 rounded-lg gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5 text-brand" /> Trocar logo
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => promptDeleteAsset('logo', 'Logo da Loja')}
                      className="text-xs h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover logo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CARD 2: BANNER DE CAPA — DESKTOP ── */}
        <Card className="border-surface bg-surface-1">
          <CardHeader className="pb-3 border-b border-surface">
            <CardTitle className="text-sm font-bold text-heading flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-brand" /> 2. Banner de Capa — Desktop
              </span>
              <span className="text-[11px] font-mono font-medium text-brand">2560 x 1097 px</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="p-3 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <span>
                <strong>Dimensão obrigatória exata: 2560 x 1097 px</strong> (proporção ~21:9). Tolerância zero de dimensão. Formatos: PNG, JPG ou WebP até 5 MB.
              </span>
            </div>

            {/* Preview Desktop */}
            {bannerUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[2560/1097] w-full rounded-xl overflow-hidden border border-surface bg-surface-2 shadow-xs">
                  <Image
                    src={bannerUrl}
                    alt="Banner Desktop"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('input-banner-desktop')?.click()}
                    className="text-xs h-8 rounded-lg gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5 text-brand" /> Trocar banner desktop
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => promptDeleteAsset('banner_desktop', 'Banner Desktop')}
                    className="text-xs h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover banner
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver('banner_desktop')}
                onDragLeave={handleDragLeave('banner_desktop')}
                onDrop={handleDrop('banner_desktop')}
                onClick={() => document.getElementById('input-banner-desktop')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive.banner_desktop
                    ? 'border-brand bg-brand/5'
                    : 'border-surface hover:border-brand/50 bg-surface-2/30'
                }`}
              >
                <Monitor className="h-6 w-6 text-brand mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  Arraste o banner desktop aqui ou clique para selecionar
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Resolução exigida: <strong>2560 x 1097 px</strong> (máx. 5 MB)
                </p>
              </div>
            )}

            <input
              id="input-banner-desktop"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileInputChange('banner_desktop')}
            />

            {uploadProgress.banner_desktop !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-brand font-semibold">
                  <span>Enviando banner desktop...</span>
                  <span>{uploadProgress.banner_desktop}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.banner_desktop}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── CARD 3: BANNER DE CAPA — MOBILE ── */}
        <Card className="border-surface bg-surface-1">
          <CardHeader className="pb-3 border-b border-surface">
            <CardTitle className="text-sm font-bold text-heading flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand" /> 3. Banner de Capa — Mobile
              </span>
              <span className="text-[11px] font-mono font-medium text-brand">1080 x 1350 px</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="p-3 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <span>
                <strong>Dimensão obrigatória exata: 1080 x 1350 px</strong> (proporção 4:5 vertical). Tolerância zero de dimensão. Formatos: PNG, JPG ou WebP até 5 MB.
              </span>
            </div>

            {/* Preview Mobile */}
            {bannerMobileUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[4/5] max-w-[240px] rounded-xl overflow-hidden border border-surface bg-surface-2 shadow-xs">
                  <Image
                    src={bannerMobileUrl}
                    alt="Banner Mobile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('input-banner-mobile')?.click()}
                    className="text-xs h-8 rounded-lg gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5 text-brand" /> Trocar banner mobile
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => promptDeleteAsset('banner_mobile', 'Banner Mobile')}
                    className="text-xs h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover banner
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver('banner_mobile')}
                onDragLeave={handleDragLeave('banner_mobile')}
                onDrop={handleDrop('banner_mobile')}
                onClick={() => document.getElementById('input-banner-mobile')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive.banner_mobile
                    ? 'border-brand bg-brand/5'
                    : 'border-surface hover:border-brand/50 bg-surface-2/30'
                }`}
              >
                <Smartphone className="h-6 w-6 text-brand mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  Arraste o banner mobile aqui ou clique para selecionar
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Resolução exigida: <strong>1080 x 1350 px</strong> (máx. 5 MB)
                </p>
              </div>
            )}

            <input
              id="input-banner-mobile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileInputChange('banner_mobile')}
            />

            {uploadProgress.banner_mobile !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-brand font-semibold">
                  <span>Enviando banner mobile...</span>
                  <span>{uploadProgress.banner_mobile}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.banner_mobile}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 4. Informações Básicas & Redes Sociais ── */}
        <Card className="border-surface bg-surface-1">
          <CardHeader className="pb-3 border-b border-surface">
            <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand" /> 4. Informações da Loja &amp; Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome da loja *</Label>
              <Input id="name" {...register('name')} className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand" />
              {errors.name && <p className="text-xs text-brand">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slogan" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                Slogan / Frase de Destaque
              </Label>
              <Input
                id="slogan"
                placeholder="Ex: Os melhores seminovos com laudo aprovado e procedência garantida."
                {...register('slogan')}
                className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">Aparece em destaque no cabeçalho da sua vitrine.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-brand" /> Instagram da Loja
              </Label>
              <Input
                id="instagram"
                placeholder="Ex: @lloficialmultimarcas ou https://www.instagram.com/lloficialmultimarcas/"
                {...register('instagram')}
                className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                Link ou @ do perfil no Instagram da sua loja. Usado nos botões e no rodapé.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand" /> Endereço físico
              </Label>
              <Input id="address" placeholder="Av. das Nações, 1500 - São Paulo, SP" {...register('address')} className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand" />
              {(!watchedAddress || !watchedAddress.trim()) && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Preencha o endereço para exibir o mapa na vitrine
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand" /> E-mail de Contato (Opcional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@sualoja.com.br"
                {...register('email')}
                className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">Exibido na seção de atendimento e no rodapé da vitrine.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maps_embed_url" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand" /> Incorporação do Google Maps (Opcional)
              </Label>
              <Input
                id="maps_embed_url"
                placeholder="Cole o código iframe ou link embed do Google Maps"
                {...register('maps_embed_url')}
                className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                Se deixar em branco, o mapa gerará a localização automaticamente pelo endereço físico acima.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opening_hours" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                Horário de Funcionamento
              </Label>
              <Input
                id="opening_hours"
                placeholder="Ex: Seg a Sex: 09h às 18h | Sáb: 09h às 13h"
                {...register('opening_hours')}
                className="bg-surface-2 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">Aparece no rodapé da vitrine e no modal do veículo. Separe múltiplos turnos por "|".</p>
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Telefones & WhatsApp por Setor ── */}
        <Card className="border-surface bg-surface-1">
          <CardHeader className="pb-3 border-b border-surface">
            <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand" /> 5. Telefones de Contato &amp; WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Telefone para Ligações */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-surface bg-surface-2/60">
              <Label htmlFor="phone" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <PhoneCall className="h-3.5 w-3.5 text-brand" /> Telefone para Ligações (Chamadas / Televendas)
              </Label>
              <Input
                id="phone"
                placeholder="Ex: (11) 2376-0448 ou 1123760448"
                {...register('phone')}
                className="bg-surface-1 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                Número discado quando o cliente clica no botão de telefone do cabeçalho ou rodapé. Pode ser fixo ou celular.
              </p>
            </div>

            {/* WhatsApp Vendas */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-surface bg-surface-2/60">
              <Label htmlFor="whatsapp" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp — Atendimento / Vendas * (responder no Zap)
              </Label>
              <Input
                id="whatsapp"
                placeholder="5511993270543 ou 551123760448"
                {...register('whatsapp')}
                className="bg-surface-1 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                Número onde seus consultores responderão conversas no WhatsApp (digite com DDI, ex: 5511993270543 ou 551123760448).
              </p>
              {errors.whatsapp && <p className="text-xs text-brand">{errors.whatsapp.message}</p>}
            </div>

            {/* WhatsApp Financeiro */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-surface bg-surface-2/60">
              <Label htmlFor="whatsapp_financeiro" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-brand" /> WhatsApp — Financiamento / Aprovação <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="whatsapp_financeiro"
                placeholder="5511993270543"
                {...register('whatsapp_financeiro')}
                className="bg-surface-1 border-surface text-foreground focus-visible:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                Clientes que solicitarem simulação de financiamento no site serão direcionados para este número. Se não preenchido, usará o número de Vendas.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="btn-brand gap-2 px-8 h-12 rounded-xl text-sm w-full sm:w-auto">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Configurações
        </Button>
      </form>

      {/* Modal de Confirmação de Remoção de Imagem */}
      {deleteModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-surface-1 border border-surface rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg text-heading uppercase tracking-wide">
                Remover {deleteModal.title}?
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: null, title: '' })}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover esta imagem? O banco de dados da loja será atualizado e o arquivo será excluído do Cloudinary de forma segura.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal({ isOpen: false, type: null, title: '' })}
                disabled={deleting}
                className="text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-xs h-9 rounded-xl gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Sim, remover imagem
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}