'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Users,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Edit2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { TenantCustomerPhoto } from '@/lib/supabase/types'

interface CustomerPhotosSectionProps {
  slug: string
  storeId?: string
}

export default function CustomerPhotosSection({ slug, storeId }: CustomerPhotosSectionProps) {
  const [photos, setPhotos] = useState<TenantCustomerPhoto[]>([])
  const [loading, setLoading] = useState(true)

  // Upload múltiplo
  const [uploading, setUploading] = useState(false)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [uploadCurrent, setUploadCurrent] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Exclusão
  const [photoToDelete, setPhotoToDelete] = useState<TenantCustomerPhoto | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edição de Legenda
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState<string>('')
  const [savingCaption, setSavingCaption] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/customer-photos?slug=${slug}&admin=true`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPhotos(data || [])
      }
    } catch (e) {
      console.error('Falha ao carregar fotos de clientes:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) fetchPhotos()
  }, [slug])

  // Upload de múltiplos arquivos sequencialmente
  const handleMultipleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      toast.error('Selecione arquivos de imagem válidos (JPG, PNG ou WEBP).')
      return
    }

    setUploadError(null)
    setUploading(true)
    setUploadTotal(fileArray.length)
    setUploadCurrent(0)

    let successCount = 0

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      setUploadCurrent(i + 1)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('slug', slug)

        // 1. Upload Cloudinary
        const uploadRes = await fetch('/api/customer-photos/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || `Erro ao enviar ${file.name}`)
        }

        const uploadData = await uploadRes.json()

        // 2. Salva registro na tabela tenant_customer_photos
        const saveRes = await fetch('/api/customer-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            store_id: storeId,
            url: uploadData.url,
            public_id: uploadData.public_id,
            caption: null,
            sort_order: photos.length + successCount,
            is_active: true,
          }),
        })

        if (!saveRes.ok) {
          const err = await saveRes.json()
          throw new Error(err.error || 'Erro ao registrar foto.')
        }

        const savedPhoto: TenantCustomerPhoto = await saveRes.json()
        setPhotos(prev => [...prev, savedPhoto])
        successCount++
      } catch (err: any) {
        console.error('Erro no upload de foto:', err)
        setUploadError(err.message || 'Falha ao processar arquivo.')
        toast.error(`Falha no upload de "${file.name}": ${err.message}`)
      }
    }

    setUploading(false)
    setUploadTotal(0)
    setUploadCurrent(0)

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? '1 foto adicionada com sucesso!'
          : `${successCount} fotos adicionadas com sucesso!`
      )
      fetchPhotos()
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Toggle Ativo / Oculto
  const handleToggleActive = async (photo: TenantCustomerPhoto) => {
    const updatedStatus = !photo.is_active
    setPhotos(prev =>
      prev.map(p => (p.id === photo.id ? { ...p, is_active: updatedStatus } : p))
    )

    try {
      const res = await fetch('/api/customer-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          photoId: photo.id,
          updates: { is_active: updatedStatus },
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao atualizar status.')
      }

      toast.success(updatedStatus ? 'Foto ativada na vitrine!' : 'Foto ocultada da vitrine.')
    } catch (e) {
      // Reverte otimista
      setPhotos(prev =>
        prev.map(p => (p.id === photo.id ? { ...p, is_active: photo.is_active } : p))
      )
      toast.error('Erro ao alternar status da foto.')
    }
  }

  // Salvar Legenda
  const handleSaveCaption = async (photoId: string) => {
    setSavingCaption(true)
    const newCaption = captionDraft.trim() || null

    try {
      const res = await fetch('/api/customer-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          photoId,
          updates: { caption: newCaption },
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao salvar legenda.')
      }

      setPhotos(prev =>
        prev.map(p => (p.id === photoId ? { ...p, caption: newCaption } : p))
      )
      setEditingPhotoId(null)
      toast.success('Legenda atualizada!')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar legenda.')
    } finally {
      setSavingCaption(false)
    }
  }

  // Reordenação Up/Down
  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const reordered = [...photos]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    // Atualiza sort_order
    const updatedWithOrder = reordered.map((photo, i) => ({
      ...photo,
      sort_order: i,
    }))

    setPhotos(updatedWithOrder)

    try {
      const res = await fetch('/api/customer-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: updatedWithOrder.map(p => ({ id: p.id, sort_order: p.sort_order })),
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao persistir reordenação.')
      }
    } catch (e) {
      toast.error('Erro ao salvar nova ordem das fotos.')
      fetchPhotos()
    }
  }

  // Confirmar e Excluir
  const confirmDelete = async () => {
    if (!photoToDelete) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/customer-photos?id=${photoToDelete.id}&slug=${slug}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir foto.')
      }

      setPhotos(prev => prev.filter(p => p.id !== photoToDelete.id))
      toast.success('Foto removida com sucesso!')
      setPhotoToDelete(null)
    } catch (e: any) {
      toast.error(e.message || 'Falha ao excluir foto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-surface bg-surface-1 shadow-xs">
      <CardHeader className="pb-3 border-b border-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Galeria de Clientes Felizes
            <span className="text-[11px] font-normal text-muted-foreground ml-1">
              (&quot;Clientes que levaram o carro pra casa&quot;)
            </span>
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {photos.length} {photos.length === 1 ? 'foto cadastrada' : 'fotos cadastradas'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Exiba fotos reais de entregas e clientes satisfeitos na vitrine pública. Fortalece a confiança e aumenta a conversão de leads.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Banner de Orientações e Boas Práticas */}
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-heading">Orientações para as fotos:</p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
              <li>
                <strong>Proporção ideal:</strong> 4:5 vertical (ex.: 800 x 1000 px) ou fotos verticais com o cliente ao lado do carro.
              </li>
              <li>
                <strong>Enquadramento automático:</strong> O sistema aplica corte inteligente centralizado no sujeito e otimização moderna (WebP/AVIF).
              </li>
              <li>
                <strong>Comportamento na Vitrine:</strong> Se houver menos de 3 fotos, são exibidas em grade estática; com 3 ou mais, ativam carrossel contínuo automático.
              </li>
            </ul>
          </div>
        </div>

        {/* Área de Upload Múltiplo (Drag & Drop) */}
        <div
          onDragOver={e => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files) {
              handleMultipleFiles(e.dataTransfer.files)
            }
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-surface hover:border-primary/50 hover:bg-surface-2/40'
          } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleMultipleFiles(e.target.files)
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-heading">
                {uploading
                  ? `Enviando foto ${uploadCurrent} de ${uploadTotal}...`
                  : 'Clique para selecionar ou arraste várias fotos aqui'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Suporta seleção múltipla de imagens (JPG, PNG ou WEBP até 12 MB cada).
              </p>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Lista de Fotos Cadastradas */}
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Carregando galeria de clientes...</span>
          </div>
        ) : photos.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-surface rounded-xl p-6 bg-surface-2/20">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-semibold text-heading text-xs">Nenhuma foto de cliente cadastrada ainda.</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
              Envie fotos de entregas de veículos para transmitir credibilidade e mostrar que a loja é ativa e confiável.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Ordem de exibição na vitrine (arraste ou use as setas):</span>
              <span className="text-[11px] font-mono">
                {photos.filter(p => p.is_active).length} ativas de {photos.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {photos.map((photo, index) => {
                const isEditing = editingPhotoId === photo.id

                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-xl border transition-all overflow-hidden bg-surface-2/50 ${
                      photo.is_active
                        ? 'border-surface shadow-xs'
                        : 'border-surface/50 opacity-60 bg-muted/20'
                    }`}
                  >
                    {/* Imagem Proporção 4:5 */}
                    <div className="relative aspect-[4/5] w-full bg-zinc-900 overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={photo.caption || 'Cliente com veículo'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Badge de Posição / Ordem */}
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full z-10">
                        #{index + 1}
                      </span>

                      {/* Badge de Ativo / Oculto */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${
                          photo.is_active
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-zinc-600/90 text-zinc-200'
                        }`}
                      >
                        {photo.is_active ? 'Ativo' : 'Oculto'}
                      </span>

                      {/* Legenda sobreposta na imagem (como aparecerá na vitrine) */}
                      {photo.caption && !isEditing && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 text-white text-xs z-10">
                          <p className="line-clamp-2 font-medium text-shadow text-[11px] leading-tight">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Barra de Ações e Legenda */}
                    <div className="p-2.5 space-y-2 bg-surface-1 border-t border-surface">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <Input
                            size={1}
                            value={captionDraft}
                            onChange={e => setCaptionDraft(e.target.value)}
                            placeholder="Ex: João e Família - Corolla 2023"
                            className="text-xs h-7 rounded-lg"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCaption(photo.id)
                              if (e.key === 'Escape') setEditingPhotoId(null)
                            }}
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => setEditingPhotoId(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[11px] gap-1"
                              disabled={savingCaption}
                              onClick={() => handleSaveCaption(photo.id)}
                            >
                              {savingCaption ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPhotoId(photo.id)
                              setCaptionDraft(photo.caption || '')
                            }}
                            className="text-[11px] text-muted-foreground hover:text-heading flex items-center gap-1 truncate text-left max-w-[150px]"
                          >
                            <Edit2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {photo.caption || 'Sem legenda (clique para adicionar)'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex items-center justify-between pt-1 border-t border-surface/60">
                        {/* Reordenar */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => handleMovePhoto(index, 'up')}
                            className="h-7 w-7 text-muted-foreground hover:text-heading"
                            title="Mover para cima/esquerda"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === photos.length - 1}
                            onClick={() => handleMovePhoto(index, 'down')}
                            className="h-7 w-7 text-muted-foreground hover:text-heading"
                            title="Mover para baixo/direita"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Visibilidade e Exclusão */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(photo)}
                            className="h-7 w-7 text-muted-foreground hover:text-heading"
                            title={photo.is_active ? 'Ocultar da vitrine' : 'Exibir na vitrine'}
                          >
                            {photo.is_active ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setPhotoToDelete(photo)}
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Excluir foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {photoToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-surface-1 border border-surface rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">Excluir foto de cliente?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta ação removerá a foto permanentemente da galeria e apagará o arquivo dos servidores do Cloudinary.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setPhotoToDelete(null)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="text-xs rounded-xl gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
