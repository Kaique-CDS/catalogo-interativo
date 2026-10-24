'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import type { TenantBanner } from '@/lib/supabase/types'

interface BrandBannerProps {
  altText?: string
  desktopBanner?: string | null
  mobileBanner?: string | null
  banners?: TenantBanner[]
}

/**
 * Normaliza URLs do Cloudinary para entrega otimizada (f_auto,q_auto)
 */
function optimizeMediaUrl(url: string, isVideo: boolean = false): string {
  if (!url || typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (isVideo) {
      if (!url.includes('/q_auto/')) {
        return url.replace('/upload/', '/upload/q_auto/')
      }
    } else {
      if (!url.includes('/f_auto,q_auto/')) {
        return url.replace('/upload/', '/upload/f_auto,q_auto/')
      }
    }
  }
  return url
}

export default function BrandBanner({
  altText = 'Bem-vindo ao catálogo',
  desktopBanner,
  mobileBanner,
  banners: propBanners,
}: BrandBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // 1. Detecta breakpoint mobile/desktop no cliente
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileDevice(window.innerWidth < 768)
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // 2. Detecta prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setIsReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
      mediaQuery.addEventListener?.('change', handler)
      return () => mediaQuery.removeEventListener?.('change', handler)
    }
  }, [])

  // 3. Monta lista de banners ativos por dispositivo
  const activeBanners: TenantBanner[] = React.useMemo(() => {
    if (propBanners && propBanners.length > 0) {
      const filtered = propBanners.filter(b => b.is_active)
      const deviceBanners = filtered.filter(b => b.device === (isMobileDevice ? 'mobile' : 'desktop'))

      // Se no mobile não houver banners dedicados, usa os de desktop como fallback
      if (isMobileDevice && deviceBanners.length === 0) {
        return filtered.filter(b => b.device === 'desktop')
      }
      return deviceBanners
    }

    // Fallback legado com props desktopBanner e mobileBanner
    const list: TenantBanner[] = []
    if (isMobileDevice && mobileBanner) {
      list.push({
        id: 'legacy-mob',
        tenant_id: 'default',
        device: 'mobile',
        media_type: 'image',
        url: mobileBanner,
        sort_order: 0,
        is_active: true,
        public_id: null,
        poster_url: null,
        link_url: null,
        created_at: new Date().toISOString(),
      })
    } else if (desktopBanner) {
      list.push({
        id: 'legacy-desk',
        tenant_id: 'default',
        device: 'desktop',
        media_type: 'image',
        url: desktopBanner,
        sort_order: 0,
        is_active: true,
        public_id: null,
        poster_url: null,
        link_url: null,
        created_at: new Date().toISOString(),
      })
    } else if (mobileBanner) {
      list.push({
        id: 'legacy-mob-fallback',
        tenant_id: 'default',
        device: 'mobile',
        media_type: 'image',
        url: mobileBanner,
        sort_order: 0,
        is_active: true,
        public_id: null,
        poster_url: null,
        link_url: null,
        created_at: new Date().toISOString(),
      })
    }
    return list
  }, [propBanners, desktopBanner, mobileBanner, isMobileDevice])

  const total = activeBanners.length
  const currentBanner = activeBanners[currentIndex % (total || 1)]

  // Função para avançar slide
  const goToNext = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex(prev => (prev + 1) % total)
  }, [total])

  // Função para voltar slide
  const goToPrev = useCallback(() => {
    if (total <= 1) return
    setCurrentIndex(prev => (prev - 1 + total) % total)
  }, [total])

  // 4. Temporizador de Autoplay inteligente
  useEffect(() => {
    if (total <= 1 || isHovered || isReducedMotion) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    // Se o banner atual for vídeo, esperamos o término do vídeo (ou no máximo 15s)
    if (currentBanner?.media_type === 'video') {
      timerRef.current = setTimeout(() => {
        goToNext()
      }, 15000)
    } else {
      // Para imagem: 5 segundos
      timerRef.current = setTimeout(() => {
        goToNext()
      }, 5000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, total, isHovered, isReducedMotion, currentBanner, goToNext])

  // 5. Suporte a touch swipe no mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrev()
      }
    }
  }

  if (total === 0) {
    return null
  }

  // Define proporção de aspecto (aspect-ratio) para evitar layout shift
  // Mobile com banner dedicado: 4:5 | Mobile fallback desktop: 16:9 | Desktop: 2560/1097 (~21:9)
  const isFallbackDesktopOnMobile = isMobileDevice && currentBanner?.device === 'desktop'
  const containerAspectClass = isMobileDevice
    ? isFallbackDesktopOnMobile
      ? 'aspect-[16/9]'
      : 'aspect-[4/5]'
    : 'aspect-[2560/1097]'

  // ==========================================
  // CENÁRIO 1: APENAS 1 BANNER ATIVO (Estático)
  // ==========================================
  if (total === 1) {
    const banner = activeBanners[0]
    const content = (
      <div className={`w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1 shadow-xs ${containerAspectClass}`}>
        {banner.media_type === 'video' ? (
          <video
            src={optimizeMediaUrl(banner.url, true)}
            poster={banner.poster_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src={optimizeMediaUrl(banner.url)}
            alt={altText}
            width={banner.device === 'desktop' ? 2560 : 1080}
            height={banner.device === 'desktop' ? 1097 : 1350}
            className="w-full h-full object-cover object-center"
            loading="eager"
            // @ts-expect-error fetchPriority é suportado em navegadores modernos
            fetchpriority="high"
          />
        )}
      </div>
    )

    if (banner.link_url) {
      return (
        <a
          href={banner.link_url}
          target={banner.link_url.startsWith('http') ? '_blank' : '_self'}
          rel={banner.link_url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="block w-full focus:outline-hidden focus:ring-2 focus:ring-brand rounded-2xl"
          aria-label={altText}
        >
          {content}
        </a>
      )
    }

    return content
  }

  // ==========================================
  // CENÁRIO 2: MÚLTIPLOS BANNERS (Carrossel)
  // ==========================================
  return (
    <div
      className="w-full relative group rounded-2xl overflow-hidden border border-surface bg-surface-1 shadow-xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Carrossel de Banners da Loja"
    >
      {/* Contêiner com proporção exata de aspecto */}
      <div className={`w-full relative overflow-hidden ${containerAspectClass}`}>
        {activeBanners.map((banner, idx) => {
          const isActive = idx === currentIndex
          const isFirstSlide = idx === 0

          const slideContent = (
            <div
              key={banner.id || idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              {banner.media_type === 'video' ? (
                <video
                  ref={isActive ? videoRef : undefined}
                  src={optimizeMediaUrl(banner.url, true)}
                  poster={banner.poster_url || undefined}
                  autoPlay={isActive}
                  muted
                  playsInline
                  preload={isActive ? 'metadata' : 'none'}
                  onEnded={goToNext}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={optimizeMediaUrl(banner.url)}
                  alt={`${altText} - Banner ${idx + 1}`}
                  width={banner.device === 'desktop' ? 2560 : 1080}
                  height={banner.device === 'desktop' ? 1097 : 1350}
                  className="w-full h-full object-cover object-center"
                  loading={isFirstSlide ? 'eager' : 'lazy'}
                  // @ts-expect-error fetchPriority é suportado em navegadores modernos
                  fetchpriority={isFirstSlide ? 'high' : 'auto'}
                />
              )}
            </div>
          )

          if (banner.link_url) {
            return (
              <a
                key={banner.id || idx}
                href={banner.link_url}
                target={banner.link_url.startsWith('http') ? '_blank' : '_self'}
                rel={banner.link_url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`absolute inset-0 w-full h-full focus:outline-hidden focus:ring-2 focus:ring-brand z-10 ${
                  isActive ? 'block' : 'hidden'
                }`}
                aria-label={`Abrir link do banner ${idx + 1}`}
              >
                {slideContent}
              </a>
            )
          }

          return slideContent
        })}
      </div>

      {/* Setas de navegação (Visíveis em hover no desktop ou discretas) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          goToPrev()
        }}
        aria-label="Banner anterior"
        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white border border-white/20 flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 shadow-md"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          goToNext()
        }}
        aria-label="Próximo banner"
        className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white border border-white/20 flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 shadow-md"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Indicadores / Dots na base */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xs border border-white/10 shadow-sm">
        {activeBanners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Ir para o banner ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === currentIndex
                ? 'w-5 sm:w-6 h-2 bg-brand'
                : 'w-2 h-2 bg-white/60 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
