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
import { Upload, Loader2, Globe, Phone, Clock, Sparkles, Image as ImageIcon, Instagram, PhoneCall, MessageCircle, MapPin, Mail, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'

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
  const supabase = createClient()
  const [logoUrl,       setLogoUrl]       = useState<string | null>(store.logo_url)
  const [bannerUrl,     setBannerUrl]     = useState<string | null>(store.banner_url)
  const [primaryColor,  setPrimaryColor]  = useState<string>(store.primary_color || '#18181B')
  const [fontFamily,    setFontFamily]    = useState<string>(store.font_family || 'Inter')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saving,        setSaving]        = useState(false)

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

      {/* 2. Logo e Banner de Capa */}
      <Card className="border-surface bg-surface-1">
        <CardHeader className="pb-3 border-b border-surface">
          <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-brand" /> Imagens da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Logo */}
          <div>
            <Label className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo da loja</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="h-16 w-16 rounded-xl border border-surface bg-surface-2 overflow-hidden flex-shrink-0">
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-contain p-1" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl border border-surface bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-muted-foreground">{store.name.charAt(0)}</span>
                </div>
              )}
              <label className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-surface rounded-xl hover:bg-surface-2 transition-colors text-foreground bg-surface-1">
                  {uploadingLogo ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />Enviando...</> : <><Upload className="h-3.5 w-3.5 text-brand" />Trocar logo</>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          {/* Banner de Capa */}
          <div className="pt-4 border-t border-surface">
            <Label className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Banner de Capa (Opcional)</Label>
            {bannerUrl && (
              <div className="relative aspect-[21/9] sm:aspect-[24/6] rounded-xl overflow-hidden mb-3 border border-surface bg-surface-2">
                <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
              </div>
            )}
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-surface rounded-xl hover:bg-surface-2 transition-colors text-foreground bg-surface-1">
                {uploadingBanner ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />Enviando...</> : <><Upload className="h-3.5 w-3.5 text-brand" />{bannerUrl ? 'Trocar banner' : 'Enviar banner de capa'}</>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
            <p className="text-[11px] text-muted-foreground mt-1.5">Recomendado: 2560x1097px. Fica no topo da vitrine.</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Informações Básicas & Redes Sociais */}
      <Card className="border-surface bg-surface-1">
        <CardHeader className="pb-3 border-b border-surface">
          <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
             <Globe className="h-4 w-4 text-brand" /> Informações da Loja & Redes Sociais
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

      {/* 4. Telefones & WhatsApp por Setor */}
      <Card className="border-surface bg-surface-1">
        <CardHeader className="pb-3 border-b border-surface">
          <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand" /> Telefones de Contato & WhatsApp
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
  )
}