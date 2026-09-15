'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Loader2, Globe, Phone, Clock, Palette, Type, Sparkles, Check, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'

const COLOR_PRESETS = [
  { name: 'Grafite Premium', hex: '#18181B' },
  { name: 'Azul Royal', hex: '#2563EB' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Vermelho Racing', hex: '#DC2626' },
  { name: 'Laranja Motors', hex: '#EA580C' },
  { name: 'Roxo Titanium', hex: '#7C3AED' },
  { name: 'Ciano Modern', hex: '#0891B2' },
  { name: 'Dourado / Âmbar', hex: '#D97706' },
]

const FONT_OPTIONS = [
  { name: 'Inter (Padrão & Limpo)', value: 'Inter', sample: 'Aa Bb Cc 123' },
  { name: 'Roboto (Neutro & Confiável)', value: 'Roboto', sample: 'Aa Bb Cc 123' },
  { name: 'Poppins (Moderna & Arrojada)', value: 'Poppins', sample: 'Aa Bb Cc 123' },
  { name: 'Montserrat (Sofisticada & Luxo)', value: 'Montserrat', sample: 'Aa Bb Cc 123' },
  { name: 'Plus Jakarta Sans (Tech & Minimalista)', value: 'Plus Jakarta Sans', sample: 'Aa Bb Cc 123' },
]

const settingsSchema = z.object({
  name:                z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  whatsapp:            z.string().min(10, 'Informe um número de WhatsApp válido (com DDI)'),
  whatsapp_financeiro: z.string().optional(),
  opening_hours:       z.string().optional(),
  address:             z.string().optional(),
  slogan:              z.string().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface Props { store: Store; slug: string }

export default function StoreSettingsForm({ store, slug }: Props) {
  const supabase = createClient()
  const [logoUrl,       setLogoUrl]       = useState<string | null>(store.logo_url)
  const [bannerUrl,     setBannerUrl]     = useState<string | null>(store.banner_url)
  const [primaryColor,  setPrimaryColor]  = useState<string>(store.primary_color || '#18181B')
  const [fontFamily,    setFontFamily]    = useState<string>(store.font_family || 'Inter')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saving,        setSaving]        = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name:                store.name,
      whatsapp:            store.whatsapp,
      whatsapp_financeiro: store.whatsapp_financeiro ?? '',
      opening_hours:       store.opening_hours ?? 'Seg a Sex: 09h às 18h',
      address:             store.address ?? '',
      slogan:              store.slogan ?? '',
    },
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const ext  = file.name.split('.').pop()
    const path = `${store.id}/logo.${ext}`
    const { error } = await supabase.storage.from('stores').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro ao enviar a logo'); setUploadingLogo(false); return }
    const { data } = supabase.storage.from('stores').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    setUploadingLogo(false)
    toast.success('Logo enviada!')
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const ext  = file.name.split('.').pop()
    const path = `${store.id}/banner.${ext}`
    const { error } = await supabase.storage.from('stores').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro ao enviar o banner'); setUploadingBanner(false); return }
    const { data } = supabase.storage.from('stores').getPublicUrl(path)
    setBannerUrl(data.publicUrl)
    setUploadingBanner(false)
    toast.success('Banner de capa enviado!')
  }

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true)
    const payload = {
      name: data.name,
      whatsapp: data.whatsapp,
      whatsapp_financeiro: data.whatsapp_financeiro || null,
      opening_hours: data.opening_hours || null,
      address: data.address || null,
      slogan: data.slogan || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      primary_color: primaryColor,
      font_family: fontFamily,
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      toast.success('Configurações salvas (Modo Demo)!')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('stores').update(payload).eq('id', store.id)
    if (error) { toast.error('Erro ao salvar as configurações'); setSaving(false); return }
    toast.success('Configurações salvas com sucesso!')
    setSaving(false)
  }

  const storefrontUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${slug}`
    : `https://seudominio.com/${slug}`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Vitrine URL */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-1">
            <Globe className="h-4 w-4" />URL da sua vitrine
          </div>
          <p className="text-sm text-blue-600 font-mono">{storefrontUrl}</p>
        </CardContent>
      </Card>

      {/* 1. Personalização Visual & Tema */}
      <Card className="border-zinc-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-600" /> Personalização Visual & Identidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cor Principal */}
          <div>
            <Label className="text-xs font-bold text-zinc-700 block mb-2">Cor Principal / Destaque do Site</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = primaryColor.toLowerCase() === preset.hex.toLowerCase()
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setPrimaryColor(preset.hex)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 shadow-xs font-bold'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full shadow-xs flex-shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: preset.hex }}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Picker */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-zinc-500 block">Cor Personalizada (Hex):</span>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="text-xs font-mono font-bold text-zinc-900 bg-transparent border-0 p-0 focus:outline-none uppercase"
                  maxLength={7}
                />
              </div>
              <div
                className="px-3 py-1 rounded-lg text-white text-xs font-bold shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Prévia do Botão
              </div>
            </div>
          </div>

          {/* Tipografia */}
          <div>
            <Label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 mb-2">
              <Type className="h-4 w-4 text-zinc-500" /> Fonte do Catálogo
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = fontFamily === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFontFamily(f.value)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{f.name}</p>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {f.sample}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slogan */}
          <div className="space-y-1.5">
            <Label htmlFor="slogan" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Slogan / Frase de Destaque da Loja
            </Label>
            <Input
              id="slogan"
              placeholder="Ex: Os melhores seminovos com laudo aprovado e procedência garantida."
              {...register('slogan')}
            />
            <p className="text-[11px] text-zinc-400">Aparece em destaque no cabeçalho da sua vitrine.</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Logo e Banner de Capa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" /> Imagens da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div>
            <Label className="mb-2 block text-xs font-bold text-zinc-700">Logo da loja</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="h-16 w-16 rounded-xl border bg-zinc-50 overflow-hidden flex-shrink-0">
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-contain p-1" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl border bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-zinc-400">{store.name.charAt(0)}</span>
                </div>
              )}
              <label className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border rounded-xl hover:bg-zinc-50 transition-colors">
                  {uploadingLogo ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Enviando...</> : <><Upload className="h-3.5 w-3.5" />Trocar logo</>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          {/* Banner de Capa */}
          <div className="pt-3 border-t border-zinc-100">
            <Label className="mb-2 block text-xs font-bold text-zinc-700">Banner de Capa (Opcional)</Label>
            {bannerUrl && (
              <div className="relative aspect-[21/9] sm:aspect-[24/6] rounded-xl overflow-hidden mb-3 border bg-zinc-100">
                <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
              </div>
            )}
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border rounded-xl hover:bg-zinc-50 transition-colors">
                {uploadingBanner ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Enviando...</> : <><Upload className="h-3.5 w-3.5" />{bannerUrl ? 'Trocar banner' : 'Enviar banner de capa'}</>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
            <p className="text-[11px] text-zinc-400 mt-1">Recomendado: 1200x300px. Fica no topo da vitrine.</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Informações Básicas & Contato */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-700">Informações da Loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome da loja *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Endereço físico</Label>
            <Input id="address" placeholder="Av. das Nações, 1500 - São Paulo, SP" {...register('address')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opening_hours" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Horário de Funcionamento
            </Label>
            <Input
              id="opening_hours"
              placeholder="Ex: Seg a Sex: 09h às 18h | Sáb: 09h às 13h"
              {...register('opening_hours')}
            />
            <p className="text-xs text-zinc-400">Aparece no rodapé da vitrine e no modal do veículo.</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. WhatsApp por Setor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-700 flex items-center gap-2">
            <Phone className="h-4 w-4" /> WhatsApp por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp — Vendas * <span className="text-[10px] text-zinc-400">(número principal)</span></Label>
            <Input id="whatsapp" placeholder="5511993270543" {...register('whatsapp')} />
            <p className="text-xs text-zinc-400">Somente números com DDI (ex: 5511993270543)</p>
            {errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp_financeiro">
              WhatsApp — Financeiro <span className="text-[10px] text-zinc-400">(opcional)</span>
            </Label>
            <Input
              id="whatsapp_financeiro"
              placeholder="5511993270543"
              {...register('whatsapp_financeiro')}
            />
            <p className="text-xs text-zinc-400">
              Clientes que solicitam simulação de financiamento serão direcionados para este número.
              Se não preenchido, usará o número de Vendas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="gap-2 px-8 h-11 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 text-white">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar Configurações
      </Button>
    </form>
  )
}