'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Play, Volume2, Sparkles } from 'lucide-react'

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
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const thumbVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null)

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

  // 2. Performance: Carrega o vídeo apenas após a página estar pronta (idle/lazy)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onLoaded = () => setIsPageLoaded(true)

    if (document.readyState === 'complete') {
      setIsPageLoaded(true)
    } else {
      window.addEventListener('load', onLoaded)
      return () => window.removeEventListener('load', onLoaded)
    }
  }, [])

  // 3. Posicionamento dinâmico: evita cobrir rodapé e respeita safe-area
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

  // 4. Acessibilidade: Tecla ESC fecha o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // 5. Gerenciamento do foco no modal
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
    setTimeout(() => {
      if (modalVideoRef.current) {
        modalVideoRef.current.currentTime = 0
        modalVideoRef.current.muted = false
        modalVideoRef.current.volume = 1
        modalVideoRef.current.play().catch(() => {
          // Se o navegador bloquear autoplay com som, libera muted para o usuário desmutar
          if (modalVideoRef.current) {
            modalVideoRef.current.muted = true
            modalVideoRef.current.play().catch(() => {})
          }
        })
      }
    }, 150)
  }

  // Ação: Fechar modal e retomar miniatura
  const handleCloseModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause()
    }
    setIsModalOpen(false)
    if (thumbVideoRef.current) {
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

          {/* Vídeo em autoplay mudo na miniatura */}
          {isPageLoaded && (
            <video
              ref={thumbVideoRef}
              src={videoUrl}
              poster={posterUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          )}

          {/* Indicador visual discreto de que é clicável com som */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

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

            {/* Player de Vídeo em Alta Resolução */}
            <div className="relative w-full aspect-[9/16] max-h-[80vh] flex items-center justify-center bg-black">
              <video
                ref={modalVideoRef}
                src={videoUrl}
                poster={posterUrl || undefined}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
