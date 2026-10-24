'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Monitor,
  Smartphone,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { TenantBanner } from '@/lib/supabase/types'
import { playableVideoUrl } from '@/lib/cloudinary-utils'

interface BannerManagementProps {
  slug: string
  storeId?: string
}

export default function BannerManagement({ slug, storeId }: BannerManagementProps) {
  const [deviceTab, setDeviceTab] = useState<'desktop' | 'mobile'>('desktop')
  const [banners, setBanners] = useState<TenantBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [missingMigration, setMissingMigration] = useState<string | null>(null)

  // Estados de upload
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Estado de exclusão
  const [bannerToDelete, setBannerToDelete] = useState<TenantBanner | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Estado de edição de link
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState<string>('')
  const [savingLink, setSavingLink] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Carrega banners
  const fetchBanners = async () => {
    try {
      const res = await fetch(`/api/banners?slug=${slug}&admin=true`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setBanners(data || [])
        const pending = res.headers.get('X-Migration-Pending')
        if (pending) {
          setMissingMigration(pending)
        } else {
          setMissingMigration(null)
        }
      }
    } catch (e) {
      console.error('Falha ao carregar banners:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) fetchBanners()
  }, [slug])

  const filteredBanners = banners.filter(b => b.device === deviceTab)

  // Upload com rastreamento real de progresso via XMLHttpRequest
  const handleFileUpload = (file: File) => {
    setUploadError(null)
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('slug', slug)
    formData.append('device', deviceTab)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/banners/upload')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 90)
        setUploadProgress(percent)
      }
    }

    xhr.onload = async () => {
      setUploadProgress(95)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const uploadData = JSON.parse(xhr.responseText)
          
          // Cria o registro na tabela tenant_banners
          const postRes = await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug,
              store_id: storeId,
              device: deviceTab,
              media_type: uploadData.media_type,
              url: uploadData.url,
              public_id: uploadData.public_id,
              poster_url: uploadData.poster_url,
              sort_order: filteredBanners.length,
              is_active: true,
            }),
          })

          if (!postRes.ok) {
            const err = await postRes.json()
            throw new Error(err.error || 'Erro ao salvar banner no catálogo.')
          }

          const savedBanner = await postRes.json()
          setBanners(prev => [...prev, savedBanner])
          setUploadProgress(100)
          toast.success(`Banner ${uploadData.media_type === 'video' ? 'de vídeo' : 'de imagem'} adicionado com sucesso!`)
          if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err: any) {
          setUploadError(err.message || 'Erro ao salvar banner.')
          toast.error(err.message || 'Falha ao salvar banner.')
        } finally {
          setUploading(false)
          setUploadProgress(null)
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          setUploadError(errData.error || 'Falha no upload do banner.')
          toast.error(errData.error || 'Erro ao enviar banner.')
        } catch {
          setUploadError('Erro ao comunicar com o servidor de upload.')
          toast.error('Erro no servidor.')
        }
        setUploading(false)
        setUploadProgress(null)
      }
    }

    xhr.onerror = () => {
      setUploadError('Erro de conexão durante o upload.')
      toast.error('Erro de conexão.')
      setUploading(false)
      setUploadProgress(null)
    }

    xhr.send(formData)
  }

  // Toggle Ativo / Pausado
  const toggleActive = async (banner: TenantBanner) => {
    const nextState = !banner.is_active
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          bannerId: banner.id,
          updates: { is_active: nextState },
        }),
      })

      if (!res.ok) throw new Error()

      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: nextState } : b))
      toast.success(nextState ? 'Banner ativado na vitrine!' : 'Banner pausado na vitrine!')
    } catch {
      toast.error('Erro ao atualizar status do banner.')
    }
  }

  // Reordenação
  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= filteredBanners.length) return

    const newFiltered = [...filteredBanners]
    const temp = newFiltered[index]
    newFiltered[index] = newFiltered[targetIndex]
    newFiltered[targetIndex] = temp

    // Atualiza sort_order
    const itemsToUpdate = newFiltered.map((b, i) => ({
      id: b.id,
      sort_order: i,
    }))

    // Atualiza estado local imediatamente (otimista)
    setBanners(prev => {
      const otherDevice = prev.filter(b => b.device !== deviceTab)
      const updatedThisDevice = newFiltered.map((b, i) => ({ ...b, sort_order: i }))
      return [...otherDevice, ...updatedThisDevice]
    })

    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, items: itemsToUpdate }),
      })
      if (!res.ok) throw new Error()
      toast.success('Ordem dos banners atualizada!')
    } catch {
      toast.error('Erro ao salvar nova ordem dos banners.')
      fetchBanners()
    }
  }

  // Salvar Link de Destino
  const handleSaveLink = async (banner: TenantBanner) => {
    setSavingLink(true)
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          bannerId: banner.id,
          updates: { link_url: linkDraft.trim() || null },
        }),
      })

      if (!res.ok) throw new Error()

      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, link_url: linkDraft.trim() || null } : b))
      setEditingLinkId(null)
      toast.success('Link do banner atualizado!')
    } catch {
      toast.error('Erro ao salvar link.')
    } finally {
      setSavingLink(false)
    }
  }

  // Exclusão com limpeza no Cloudinary
  const confirmDelete = async () => {
    if (!bannerToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/banners?id=${bannerToDelete.id}&slug=${slug}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao excluir banner.')
      }

      setBanners(prev => prev.filter(b => b.id !== bannerToDelete.id))
      toast.success('Banner excluído com sucesso do catálogo e Cloudinary!')
      setBannerToDelete(null)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover banner.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="rounded-2xl border-surface bg-surface-1 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
              <Monitor className="h-4 w-4 text-brand" /> Banners da Vitrine (Carrossel Imagens &amp; Vídeos)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastre múltiplos banners para desktop e mobile com rotação automática na vitrine.
            </p>
          </div>

          {/* Abas de Dispositivo */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                setDeviceTab('desktop')
                setUploadError(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                deviceTab === 'desktop'
                  ? 'bg-surface-1 text-brand font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop ({banners.filter(b => b.device === 'desktop').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setDeviceTab('mobile')
                setUploadError(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                deviceTab === 'mobile'
                  ? 'bg-surface-1 text-brand font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile ({banners.filter(b => b.device === 'mobile').length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {missingMigration && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>Banco de dados desatualizado:</strong> A tabela <code>tenant_banners</code> não existe no Supabase (falta aplicar a <strong>Migration 023</strong>). Os banners legados da loja estão sendo exibidos como fallback.
              </span>
            </div>
            <Link href={`/${slug}/admin/diagnostico`}>
              <Button size="sm" variant="outline" className="text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 h-7 rounded-lg shrink-0 font-bold">
                Ver Diagnóstico
              </Button>
            </Link>
          </div>
        )}

        {/* Caixa de Especificação Rígida do Dispositivo */}
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              {deviceTab === 'desktop'
                ? 'Especificação Desktop: 2560 x 1097 px (~21:9)'
                : 'Especificação Mobile: 1080 x 1350 px (4:5)'}
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>Imagens:</strong> PNG, JPG ou WebP de dimensão exata (tolerância zero de corte), até 5 MB.
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>Vídeos:</strong> MP4 ou WebM, até 30 MB (o poster é gerado automaticamente pelo Cloudinary).
            </p>
          </div>
        </div>

        {/* Alerta de Erro de Upload */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button type="button" onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Área de Upload / Dropzone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-heading">
              Adicionar Novo Banner {deviceTab === 'desktop' ? 'Desktop' : 'Mobile'}
            </Label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setUploadType('image')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  uploadType === 'image'
                    ? 'bg-brand/10 text-brand border border-brand/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ImageIcon className="h-3 w-3 inline mr-1" /> Imagem
              </button>
              <button
                type="button"
                onClick={() => setUploadType('video')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  uploadType === 'video'
                    ? 'bg-brand/10 text-brand border border-brand/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Video className="h-3 w-3 inline mr-1" /> Vídeo
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const files = e.dataTransfer.files
              if (files && files[0]) handleFileUpload(files[0])
            }}
            onClick={() => {
              if (!uploading && fileInputRef.current) fileInputRef.current.click()
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-brand bg-brand/5'
                : 'border-surface hover:border-brand/50 hover:bg-surface-2/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={uploadType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files[0]) handleFileUpload(files[0])
              }}
            />

            {uploading ? (
              <div className="space-y-3 py-2">
                <Loader2 className="h-8 w-8 text-brand animate-spin mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  Enviando {uploadType === 'video' ? 'vídeo' : 'imagem'} para o Cloudinary...
                </p>
                {uploadProgress !== null && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto text-brand">
                  {uploadType === 'video' ? <Video className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                <p className="text-xs font-bold text-foreground">
                  Arraste ou clique para enviar {uploadType === 'video' ? 'um vídeo' : 'uma imagem'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {uploadType === 'video'
                    ? 'MP4 ou WebM até 30 MB'
                    : deviceTab === 'desktop'
                    ? 'Exatamente 2560 x 1097 px (até 5 MB)'
                    : 'Exatamente 1080 x 1350 px (até 5 MB)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Banners Cadastrados para o Dispositivo */}
        <div className="space-y-3 pt-2 border-t border-surface">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
              Banners Cadastrados — {deviceTab === 'desktop' ? 'Desktop' : 'Mobile'} ({filteredBanners.length})
            </h3>
            {filteredBanners.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                Arraste ou use as setas para reordenar a rotação do carrossel
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 text-brand animate-spin mx-auto" />
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="py-10 text-center rounded-xl border border-surface bg-surface-2/30">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-heading">Nenhum banner {deviceTab} cadastrado</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Envie o primeiro banner no campo acima para exibi-lo na vitrine.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBanners.map((banner, index) => {
                const isFirst = index === 0
                const isLast = index === filteredBanners.length - 1
                const isEditingLink = editingLinkId === banner.id

                return (
                  <div
                    key={banner.id}
                    className="p-3.5 rounded-2xl bg-surface-2/40 border border-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-surface-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Miniatura com indicador de mídia */}
                      <div className="relative h-16 w-24 sm:h-18 sm:w-28 rounded-xl overflow-hidden bg-surface-2 border border-surface shrink-0">
                        {banner.media_type === 'video' ? (
                          <div className="relative w-full h-full">
                            {banner.poster_url ? (
                              <img src={banner.poster_url} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <video src={playableVideoUrl(banner.url, { width: 480 })} className="w-full h-full object-cover" preload="metadata" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="h-5 w-5 text-white fill-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Informações */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            banner.media_type === 'video'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          }`}>
                            {banner.media_type === 'video' ? 'Vídeo' : 'Imagem'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            banner.is_active ? 'badge-status-published' : 'badge-status-hidden'
                          }`}>
                            {banner.is_active ? 'Ativo na Vitrine' : 'Pausado'}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand/10 text-brand border border-brand/20">
                              Principal (1º Slide)
                            </span>
                          )}
                        </div>

                        {/* Link de destino */}
                        {isEditingLink ? (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Input
                              placeholder="https://... ou /ll-multimarcas?q=civic"
                              value={linkDraft}
                              onChange={(e) => setLinkDraft(e.target.value)}
                              className="h-8 text-xs bg-surface-1 rounded-lg"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveLink(banner)}
                              disabled={savingLink}
                              className="h-8 px-2.5 text-xs font-bold btn-brand rounded-lg"
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingLinkId(null)}
                              className="h-8 px-2 text-xs rounded-lg"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-muted-foreground truncate">
                              {banner.link_url ? (
                                <span className="text-brand font-medium flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3 shrink-0" /> {banner.link_url}
                                </span>
                              ) : (
                                <span className="italic">Sem link ao clicar</span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLinkId(banner.id)
                                setLinkDraft(banner.link_url || '')
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold hover:underline"
                            >
                              {banner.link_url ? 'Alterar link' : '+ Adicionar link'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações (Reordenação, Pausar/Ativar, Excluir) */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface">
                      {/* Setas de Reordenação */}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isFirst}
                        onClick={() => moveBanner(index, 'up')}
                        title="Mover para cima"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isLast}
                        onClick={() => moveBanner(index, 'down')}
                        title="Mover para baixo"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>

                      {/* Ativar / Pausar */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive(banner)}
                        title={banner.is_active ? 'Pausar banner' : 'Ativar banner'}
                        className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-emerald-400" />}
                      </Button>

                      {/* Excluir com confirmação */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setBannerToDelete(banner)}
                        title="Excluir banner"
                        className="h-9 w-9 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal de Confirmação de Exclusão com limpeza Cloudinary */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => !deleting && setBannerToDelete(null)} />
          <div className="relative w-full max-w-md bg-surface-1 border border-surface rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-heading leading-tight">
                  Excluir Banner
                </h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5">
                  Ação permanente com remoção no Cloudinary
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Tem certeza que deseja remover este banner? O arquivo será deletado permanentemente do catálogo e do Cloudinary.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setBannerToDelete(null)}
                className="rounded-xl border-surface text-xs font-semibold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 px-4 gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
