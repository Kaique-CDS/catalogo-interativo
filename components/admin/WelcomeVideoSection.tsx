'use client'

import React, { useState, useRef } from 'react'
import {
  Video,
  Upload,
  Trash2,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Store } from '@/lib/supabase/types'

interface WelcomeVideoSectionProps {
  store: Store
  slug: string
}

export default function WelcomeVideoSection({ store, slug }: WelcomeVideoSectionProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(store.welcome_video_url || null)
  const [posterUrl, setPosterUrl] = useState<string | null>(store.welcome_video_poster_url || null)
  const [publicId, setPublicId] = useState<string | null>(store.welcome_video_public_id || null)
  const [enabled, setEnabled] = useState<boolean>(Boolean(store.welcome_video_enabled))

  // Estados de upload
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Estados de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Toggle Ativar / Desativar
  const handleToggleEnabled = async () => {
    const nextState = !enabled
    setEnabled(nextState)

    try {
      const res = await fetch('/api/welcome-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          welcome_video_enabled: nextState,
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(nextState ? 'Vídeo institucional ativado na vitrine!' : 'Vídeo institucional pausado!')
    } catch {
      setEnabled(!nextState)
      toast.error('Erro ao atualizar status do vídeo.')
    }
  }

  // Upload do vídeo via XMLHttpRequest com barra de progresso
  const handleFileUpload = (file: File) => {
    setUploadError(null)
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('slug', slug)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/welcome-video/upload')

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

          // Salva no banco de dados e ativa o vídeo
          const putRes = await fetch('/api/welcome-video', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug,
              welcome_video_url: uploadData.url,
              welcome_video_public_id: uploadData.public_id,
              welcome_video_poster_url: uploadData.poster_url,
              welcome_video_enabled: true,
            }),
          })

          if (!putRes.ok) throw new Error()

          // Se havia um vídeo antigo antes da troca, apaga do Cloudinary
          if (publicId && publicId !== uploadData.public_id) {
            fetch(`/api/welcome-video?slug=${slug}&public_id=${publicId}`, { method: 'DELETE' }).catch(() => {})
          }

          setVideoUrl(uploadData.url)
          setPosterUrl(uploadData.poster_url)
          setPublicId(uploadData.public_id)
          setEnabled(true)
          setUploadProgress(100)
          toast.success('Vídeo institucional publicado com sucesso!')
          if (fileInputRef.current) fileInputRef.current.value = ''
        } catch {
          setUploadError('Erro ao salvar vídeo nas configurações da loja.')
          toast.error('Falha ao salvar vídeo.')
        } finally {
          setUploading(false)
          setUploadProgress(null)
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          setUploadError(errData.error || 'Falha no upload do vídeo.')
          toast.error(errData.error || 'Erro ao enviar vídeo.')
        } catch {
          setUploadError('Erro no servidor de upload.')
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

  // Exclusão com confirmação e remoção no Cloudinary
  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/welcome-video?slug=${slug}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error()

      setVideoUrl(null)
      setPosterUrl(null)
      setPublicId(null)
      setEnabled(false)
      setIsDeleteModalOpen(false)
      toast.success('Vídeo institucional removido da loja e do Cloudinary!')
    } catch {
      toast.error('Erro ao remover vídeo institucional.')
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
              <Video className="h-4 w-4 text-brand" /> Vídeo Institucional Flutuante (Pop-up de Apresentação)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Widget em miniatura no canto inferior esquerdo da vitrine que abre em tela cheia com som.
            </p>
          </div>

          {/* Toggle de ativação */}
          {videoUrl && (
            <button
              type="button"
              onClick={handleToggleEnabled}
              className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-surface-2 border border-surface text-xs font-semibold"
            >
              <span className={enabled ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                {enabled ? 'Widget Ativo' : 'Widget Desativado'}
              </span>
              {enabled ? (
                <ToggleRight className="h-5 w-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              Apresente sua loja aos clientes com vídeo vertical
            </p>
            <p className="text-[11px] leading-relaxed">
              • O vídeo roda em loop mudo na miniatura e, ao clicar, abre centralizado em alta resolução <strong>com áudio</strong>.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Formatos: <strong>MP4 ou WebM</strong> até 30 MB (proporção recomendada: 9:16 vertical de smartphone).
            </p>
          </div>
        </div>

        {/* Erro de upload se houver */}
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

        {/* Se já existe vídeo cadastrado: Player de Pré-visualização + Ações */}
        {videoUrl ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-surface-2/50 border border-surface">
              {/* Miniatura do player */}
              <div className="relative w-28 h-40 sm:w-32 sm:h-44 rounded-xl overflow-hidden bg-black border border-surface shrink-0 shadow-md">
                <video
                  src={videoUrl}
                  poster={posterUrl || undefined}
                  muted
                  playsInline
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Play className="h-2 w-2 fill-white" /> Loop
                </div>
              </div>

              {/* Informações e Botões */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-500/15 text-muted-foreground border-surface'
                  }`}>
                    {enabled ? 'Visível na Vitrine' : 'Oculto na Vitrine'}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Canto inferior esquerdo
                  </span>
                </div>

                <p className="text-xs text-foreground font-semibold">
                  Vídeo de apresentação carregado com sucesso.
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Os visitantes verão a miniatura flutuante tocar no canto inferior esquerdo e poderão clicar para assistir com som.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs h-9 rounded-xl border-surface gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5 text-brand" /> Trocar Vídeo
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={uploading}
                    className="text-xs h-9 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover Vídeo
                  </Button>
                </div>
              </div>
            </div>

            {/* Input oculto para troca */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files[0]) handleFileUpload(files[0])
              }}
            />
          </div>
        ) : (
          /* Se NÃO há vídeo cadastrado: Dropzone de Upload */
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
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-brand bg-brand/5'
                : 'border-surface hover:border-brand/50 hover:bg-surface-2/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
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
                  Enviando vídeo institucional para o Cloudinary...
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
                  <Video className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Arraste ou clique para enviar o vídeo institucional da loja
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Formato MP4 ou WebM até 30 MB (o poster será gerado automaticamente)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => !deleting && setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-1 border border-surface rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-heading leading-tight">
                  Remover Vídeo Institucional
                </h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5">
                  Ação permanente com remoção no Cloudinary
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Tem certeza que deseja remover o vídeo institucional? Ele deixará de aparecer na vitrine e o arquivo será apagado do Cloudinary.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setIsDeleteModalOpen(false)}
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
                    <span>Confirmar Remoção</span>
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
