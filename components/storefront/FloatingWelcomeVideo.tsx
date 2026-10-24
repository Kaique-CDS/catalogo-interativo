'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Play, Volume2, Sparkles, RefreshCw } from 'lucide-react'
import { playableVideoUrl } from '@/lib/cloudinary-utils'

interface FloatingWelcomeVideoProps {
  slug: string
  storeName: string
  videoUrl?: string | null
  posterUrl?: string | null
  enabled?: boolean | null
}

const DISMISS_DAYS = 7 // Dias até reexibir após o usuário fechar a miniatura

export default function FloatingWelcomeVideo({
  slug,
  storeName,
  videoUrl,
  posterUrl,
  enabled,
}: FloatingWelcomeVideoProps) {
  const [isDismissed, setIsDismissed] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bottomOffset, setBottomOffset] = useState<number>(0)
  const [thumbHasError, setThumbHasError] = useState(false)
  const [modalHasError, setModalHasError] = useState(false)

  const thumbVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null)

  // URLs transcodificadas para MP4 H.264 universal
  const playableThumbUrl = playableVideoUrl(videoUrl, { width: 320 })
  const playableModalUrl = playableVideoUrl(videoUrl, { width: 720 })

  // 1. Verifica localStorage para saber se o usuário dispensou a miniatura recentemente
  useEffect(() => {
    if (!slug) return
    try {
      const storageKey = `catalogo_welcome_video_dismissed_${slug}`
      const dismissedTimestamp = localStorage.getItem(storageKey)
      if (dismissedTimestamp) {
        const timePassedMs = Date.now() - Number(dismissedTimestamp)
        const daysPassed = timePassedMs / (1000 * 60 * 60 * 24)
        if (daysPassed < DISMISS_DAYS) {
          setIsDismissed(true)
          return
        }
      }
      setIsDismissed(false)
    } catch {
      setIsDismissed(false)
    }
  }, [slug])

  // 2. Garantir reprodução contínua e contornar a política restritiva de autoplay do Chromium/React
  useEffect(() => {
    if (isModalOpen) return

    const video = thumbVideoRef.current
    if (!video) return

    // Propriedades essenciais no elemento DOM para liberar autoplay sem interação prévia
    video.defaultMuted = true
    video.muted = true
    video.playsInline = true

    const playSafe = () => {
      const v = thumbVideoRef.current
      if (!v || isModalOpen) return
      v.defaultMuted = true
      v.muted = true
      const p = v.play()
      if (p !== undefined) {
        p.catch(() => {
          // Autoplay aguardando interação do usuário na página
        })
      }
    }

    playSafe()

    // Tenta novamente assim que os dados chegarem
    video.addEventListener('loadeddata', playSafe)
    video.addEventListener('canplay', playSafe)
    video.addEventListener('loadedmetadata', playSafe)

    // Se o navegador barrar o autoplay silencioso inicial, inicia no primeiro clique, toque ou scroll na página
    const onFirstUserAction = () => {
      playSafe()
      window.removeEventListener('click', onFirstUserAction)
      window.removeEventListener('touchstart', onFirstUserAction)
      window.removeEventListener('scroll', onFirstUserAction)
    }

    window.addEventListener('click', onFirstUserAction, { passive: true })
    window.addEventListener('touchstart', onFirstUserAction, { passive: true })
    window.addEventListener('scroll', onFirstUserAction, { passive: true })

    return () => {
      video.removeEventListener('loadeddata', playSafe)
      video.removeEventListener('canplay', playSafe)
      video.removeEventListener('loadedmetadata', playSafe)
      window.removeEventListener('click', onFirstUserAction)
      window.removeEventListener('touchstart', onFirstUserAction)
      window.removeEventListener('scroll', onFirstUserAction)
    }
  }, [playableThumbUrl, isModalOpen])

  // 3. Reativa autoplay da miniatura quando a aba do navegador volta a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        !isModalOpen &&
        thumbVideoRef.current
      ) {
        thumbVideoRef.current.defaultMuted = true
        thumbVideoRef.current.muted = true
        thumbVideoRef.current.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isModalOpen])

  // 4. Posicionamento dinâmico: evita cobrir rodapé e respeita safe-area
  useEffect(() => {
    const findFooter = () =>
      document.querySelector('footer.store-footer') ||
      document.querySelector('footer')

    const updatePosition = () => {
      const footer = findFooter()
      if (!footer) {
        setBottomOffset(0)
        return
      }

      const rect = footer.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const overlap = windowHeight - rect.top

      if (overlap > 0) {
        setBottomOffset(Math.round(overlap + 16))
      } else {
        setBottomOffset(0)
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [])

  // 5. Acessibilidade: Tecla ESC fecha o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // 6. Gerenciamento do foco no modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        modalCloseBtnRef.current?.focus()
      }, 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  // Se desativado no admin, sem URL ou dispensado pelo usuário, nada é renderizado
  if (!enabled || !videoUrl || isDismissed) {
    return null
  }

  // Ação: Dispensar miniatura pelo "X"
  const handleDismissThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissed(true)
    try {
      const storageKey = `catalogo_welcome_video_dismissed_${slug}`
      localStorage.setItem(storageKey, String(Date.now()))
    } catch {}
  }

  // Ação: Abrir modal com som
  const handleOpenModal = () => {
    setIsModalOpen(true)
    if (thumbVideoRef.current) {
      thumbVideoRef.current.pause()
    }
  }

  // Ação: Fechar modal e retomar miniatura
  const handleCloseModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause()
    }
    setIsModalOpen(false)
    if (thumbVideoRef.current) {
      thumbVideoRef.current.defaultMuted = true
      thumbVideoRef.current.muted = true
      thumbVideoRef.current.play().catch(() => {})
    }
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MINIATURA FLUTUANTE FIXA NO CANTO INFERIOR ESQUERDO   */}
      {/* ======================================================== */}
      <aside
        style={{
          bottom: bottomOffset > 0 ? `${bottomOffset}px` : undefined,
        }}
        className={`fixed left-3.5 sm:left-6 z-40 transition-all duration-300 ease-out pb-[max(1rem,env(safe-area-inset-bottom))] ${
          bottomOffset === 0 ? 'bottom-3 sm:bottom-6' : ''
        } ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Vídeo institucional da loja"
      >
        <div
          onClick={handleOpenModal}
          className="relative group cursor-pointer select-none rounded-2xl overflow-hidden border-2 border-white/40 dark:border-zinc-700/80 shadow-2xl bg-black transform hover:scale-105 active:scale-95 transition-all duration-300
                     w-[96px] h-[132px] sm:w-[136px] sm:h-[188px]"
        >
          {/* Botão X para dispensar a miniatura */}
          <button
            type="button"
            onClick={handleDismissThumbnail}
            aria-label="Dispensar vídeo"
            title="Dispensar vídeo"
            className="absolute top-1.5 right-1.5 z-30 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-xs"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>

          {/* Poster como plano de fundo fixo: impede qualquer quadro vazio ou tela preta */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt={storeName}
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
            />
          )}

          {/* Vídeo em autoplay mudo na miniatura (MP4 H.264 leve w_320) */}
          {!thumbHasError && (
            <video
              ref={(el) => {
                thumbVideoRef.current = el
                if (el) {
                  el.defaultMuted = true
                  el.muted = true
                  el.playsInline = true
                  el.play().catch(() => {})
                }
              }}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.defaultMuted = true
                e.currentTarget.muted = true
                e.currentTarget.play().catch(() => {})
              }}
              onError={(e) => {
                console.error('[FloatingWelcomeVideo] Erro na miniatura do vídeo institucional:', e)
                setThumbHasError(true)
              }}
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-10"
            >
              <source src={playableThumbUrl} type="video/mp4" />
              {videoUrl && videoUrl !== playableThumbUrl && (
                <source src={videoUrl} type="video/mp4" />
              )}
            </video>
          )}

          {/* Indicador visual discreto de que é clicável com som */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-20" />

          <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between text-white pointer-events-none">
            <span className="text-[10px] sm:text-xs font-bold truncate tracking-wide">
              Conheça a loja
            </span>
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-brand text-white flex items-center justify-center shadow-xs shrink-0">
              <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white ml-0.5" />
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MODAL CENTRALIZADO (COM SOM E CONTROLES NATIVOS)      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vídeo institucional de ${storeName}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Header do Modal com botão fechar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between text-white pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs font-bold truncate max-w-[200px]">
                  {storeName}
                </span>
              </div>

              <button
                ref={modalCloseBtnRef}
                type="button"
                onClick={handleCloseModal}
                aria-label="Fechar vídeo"
                className="pointer-events-auto h-9 w-9 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-transform active:scale-95 shadow-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Player de Vídeo em Alta Resolução (MP4 H.264 w_720) */}
            <div className="relative w-full aspect-[9/16] max-h-[80vh] flex items-center justify-center bg-black">
              {modalHasError && posterUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={posterUrl}
                    alt={storeName}
                    className="w-full h-full object-contain opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/60 space-y-3">
                    <p className="text-xs font-medium text-zinc-300">
                      Não foi possível reproduzir este vídeo diretamente.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalHasError(false)
                        if (modalVideoRef.current) {
                          modalVideoRef.current.load()
                          modalVideoRef.current.play().catch(() => {})
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Tentar Novamente
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  ref={(el) => {
                    modalVideoRef.current = el
                    if (el) {
                      el.playsInline = true
                      el.volume = 1
                      // Tenta tocar com som, fallback mudo se browser bloquear
                      const playPromise = el.play()
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {
                          el.muted = true
                          el.play().catch(() => {})
                        })
                      }
                    }
                  }}
                  autoPlay
                  controls
                  playsInline
                  preload="auto"
                  onError={(e) => {
                    console.error('[FloatingWelcomeVideo] Erro no player do modal:', e)
                    setModalHasError(true)
                  }}
                  className="w-full h-full object-contain"
                >
                  <source src={playableModalUrl} type="video/mp4" />
                  {videoUrl && videoUrl !== playableModalUrl && (
                    <source src={videoUrl} type="video/mp4" />
                  )}
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
