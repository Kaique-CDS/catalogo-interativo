'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Heart } from 'lucide-react'
import { normalizeCustomerPhotoUrl } from '@/lib/cloudinary-utils'
import type { TenantCustomerPhoto, Store } from '@/lib/supabase/types'

interface CustomerPhotosSectionProps {
  photos?: TenantCustomerPhoto[] | null
  store?: Store | null
  slug?: string
}

export default function CustomerPhotosSection({
  photos: initialPhotos,
  store,
  slug,
}: CustomerPhotosSectionProps) {
  const [photos, setPhotos] = useState<TenantCustomerPhoto[]>(initialPhotos || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Touch Swipe
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)

  // Carrega se não veio via props
  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos)
      return
    }

    const tenantSlug = slug || store?.slug
    if (tenantSlug) {
      fetch(`/api/customer-photos?slug=${tenantSlug}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : []))
        .then((data: TenantCustomerPhoto[]) => {
          if (Array.isArray(data)) {
            setPhotos(data.filter(p => p.is_active))
          }
        })
        .catch(() => {})
    }
  }, [initialPhotos, slug, store?.slug])

  // Checa preferência do sistema por redução de movimento
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener?.('change', handler)
      return () => mediaQuery.removeEventListener?.('change', handler)
    }
  }, [])

  const activePhotos = photos.filter(p => p.is_active)
  const count = activePhotos.length

  const nextSlide = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex(prev => (prev + 1) % count)
  }, [count])

  const prevSlide = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex(prev => (prev - 1 + count) % count)
  }, [count])

  // Autoplay contínuo a cada 4s quando >= 3 fotos
  useEffect(() => {
    if (count < 3 || isPaused || prefersReducedMotion) return

    const timer = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(timer)
  }, [count, isPaused, prefersReducedMotion, nextSlide])

  // Se 0 fotos, a seção inteira NÃO renderiza (Requisito obrigatório)
  if (count === 0) {
    return null
  }

  // Tratamento de gestos de Swipe mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchEndXRef.current = null
    setIsPaused(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    setIsPaused(false)
    if (touchStartXRef.current === null || touchEndXRef.current === null) return
    const diff = touchStartXRef.current - touchEndXRef.current
    if (diff > 45) {
      nextSlide()
    } else if (diff < -45) {
      prevSlide()
    }
  }

  const primaryColor = store?.primary_color || '#18181B'

  return (
    <section
      aria-label="Clientes que levaram o carro pra casa"
      className="py-12 sm:py-16 md:py-20 relative overflow-hidden bg-surface-1/40 border-y border-surface/50"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Cabeçalho da Seção - Clean, discreto e elegante */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-surface-2 text-muted-foreground border border-surface mb-3">
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500/20" />
            <span>Quem compra recomenda</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-heading">
            Clientes que levaram o carro pra casa
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Mais do que vender carros, realizamos sonhos. Veja quem já acelerou com a gente!
          </p>
        </div>

        {/* ============================================================== */}
        {/* CENÁRIO 1: MENOS DE 3 FOTOS => GRADE ESTÁTICA ELEGANTE */}
        {/* ============================================================== */}
        {count < 3 ? (
          <div
            className={`grid gap-5 mx-auto ${
              count === 1
                ? 'max-w-xs'
                : 'grid-cols-1 sm:grid-cols-2 max-w-xl'
            }`}
          >
            {activePhotos.map((photo, i) => (
              <div
                key={photo.id || i}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-2 shadow-xs border border-surface/60 transition-transform duration-300 hover:scale-[1.01]"
              >
                <Image
                  src={normalizeCustomerPhotoUrl(photo.url, 800, 1000)}
                  alt={photo.caption || 'Cliente satisfeito com seu novo veículo'}
                  fill
                  sizes="(max-width: 640px) 90vw, 400px"
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Legenda sobreposta apenas se preenchida */}
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-8 text-white">
                    <p className="text-xs sm:text-sm font-medium leading-snug drop-shadow-sm">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ============================================================== */
          /* CENÁRIO 2: 3 OU MAIS FOTOS => CARROSSEL AUTOMÁTICO SUAVE       */
          /* ============================================================== */
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Contêiner de Visualização do Carrossel */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  // No mobile exibe ~1.5 fotos (desloca 70% por índice)
                  // No tablet/desktop exibe 3 a 4 fotos (desloca ~25% ou ~33.3% por índice)
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transitionProperty: prefersReducedMotion ? 'none' : 'transform',
                }}
              >
                {activePhotos.map((photo, index) => {
                  return (
                    <div
                      key={photo.id || index}
                      className="w-full shrink-0 px-2 sm:px-3"
                    >
                      {/* Grid responsivo interno para exibir múltiplos itens visíveis ao mesmo tempo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, offset) => {
                          const itemIndex = (index + offset) % count
                          const currentPhoto = activePhotos[itemIndex]
                          const isHiddenMobile = offset >= 1
                          const isHiddenTablet = offset >= 2
                          const isHiddenDesktop = offset >= 4

                          return (
                            <div
                              key={`${currentPhoto.id}-${offset}`}
                              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-2 shadow-xs border border-surface/50 transition-all duration-300 hover:shadow-md ${
                                isHiddenMobile ? 'hidden sm:block' : ''
                              } ${isHiddenTablet ? 'sm:hidden md:block' : ''} ${
                                isHiddenDesktop ? 'lg:hidden' : ''
                              }`}
                            >
                              <Image
                                src={normalizeCustomerPhotoUrl(currentPhoto.url, 800, 1000)}
                                alt={currentPhoto.caption || 'Cliente com o carro novo'}
                                fill
                                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 33vw, 25vw"
                                loading="lazy"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />

                              {/* Legenda sobreposta discreta com gradiente sutil, apenas se existir legenda */}
                              {currentPhoto.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 pt-8 text-white z-10">
                                  <p className="text-xs font-medium leading-snug line-clamp-2 drop-shadow-sm">
                                    {currentPhoto.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Setas Discretas de Navegação - Apenas Desktop */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Foto anterior"
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xs shadow-md border border-surface/80 items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Próxima foto"
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xs shadow-md border border-surface/80 items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Indicadores de Paginação / Dots */}
            {count > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {activePhotos.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentIndex(dotIdx)}
                    aria-label={`Ir para foto ${dotIdx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      dotIdx === currentIndex
                        ? 'w-6 bg-zinc-900 dark:bg-white'
                        : 'w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
