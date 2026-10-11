'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  X, Calendar, Gauge, Fuel, Cog, Check, ShieldCheck, MapPin,
  Share2, ChevronDown, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMileage } from '@/lib/utils'
import type { Vehicle, Store } from '@/lib/supabase/types'
import { toast } from 'sonner'
import InterestOptionsSheet from './InterestOptionsSheet'
import FinancingModal from './FinancingModal'

interface Props {
  vehicle: Vehicle | null
  store: Store
  onClose: () => void
  initialStep?: ModalStep
}

type ModalStep = 'detail' | 'interest' | 'financing'

export default function VehicleDetailModal({ vehicle, store, onClose, initialStep = 'detail' }: Props) {
  const [step, setStep]           = useState<ModalStep>(initialStep)
  const [hasTradeIn, setHasTradeIn] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  const photoScrollRef = React.useRef<HTMLDivElement>(null)

  const handlePhotoScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    const width = e.currentTarget.clientWidth
    if (width > 0) {
      setActivePhoto(Math.round(scrollLeft / width))
    }
  }

  const scrollPhotos = (direction: 'left' | 'right') => {
    if (photoScrollRef.current) {
      const width = photoScrollRef.current.clientWidth
      photoScrollRef.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' })
    }
  }

  // Trava o scroll da página de trás enquanto o modal está aberto.
  // overflow:hidden sozinho não funciona no iOS Safari, então fixamos o body
  // na posição atual e restauramos o scroll exato ao fechar.
  const isOpen = !!vehicle
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    const body = document.body
    const html = document.documentElement
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      overscroll: html.style.overscrollBehavior,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'

    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      html.style.overflow = prev.htmlOverflow
      html.style.overscrollBehavior = prev.overscroll
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  useEffect(() => {
    if (!vehicle) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step !== 'detail') setStep('detail')
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Track vehicle view
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: vehicle.store_id || 'demo-store-id',
        vehicle_id: vehicle.id,
        event_type: 'page_view',
        source: 'direct' // It's internal navigation, so direct or we could try to inherit
      })
    }).catch(console.error)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [vehicle, onClose, step])

  // Reset step when modal changes vehicle or initialStep changes
  useEffect(() => {
    setStep(initialStep)
    setHasTradeIn(false)
  }, [vehicle?.id, initialStep])

  if (!vehicle) return null

  const handleShare = async () => {
    // Track Share
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: vehicle.store_id || 'demo-store-id',
        vehicle_id: vehicle.id,
        event_type: 'share',
        source: 'direct'
      })
    }).catch(console.error)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${origin}/${store.slug}?v=${vehicle.id}`
    const shareTitle = `${vehicle.title} (${vehicle.year}) - ${store.name}`
    const shareText = `🚗 *${vehicle.title} (${vehicle.year})*\n💬 *Preço sob consulta via WhatsApp*\n\nConfira fotos e ficha completa na *${store.name}*:\n${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // Usuário cancelou ou navegador não suportou, fallback para copiar
      }
    }

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('Link e dados do veículo copiados!')
    } catch {
      toast.success('Link do veículo copiado!')
    }
  }

  const storeForModals = {
    name: store.name,
    whatsapp: store.whatsapp,
    whatsapp_financeiro: store.whatsapp_financeiro,
  }

  return (
    <>
      {/* Main Detail Modal */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden overscroll-none animate-in fade-in-0 duration-200"
        onClick={onClose}
      >
        <div
          className="bg-surface-0 border border-surface w-full max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Photos Carousel */}
          <div className="relative aspect-[16/10] sm:aspect-video w-full bg-zinc-900 flex-shrink-0 overflow-hidden group/photos">
            {vehicle.images && vehicle.images.length > 0 ? (
              <>
                <button 
                  onClick={() => scrollPhotos('left')}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover/photos:opacity-100 transition-opacity hover:bg-black/60"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <div 
                  ref={photoScrollRef}
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  onScroll={handlePhotoScroll}
                >
                  {vehicle.images.map((img, idx) => (
                    <div key={idx} className="relative min-w-full h-full snap-center shrink-0">
                      <Image
                        src={img}
                        alt={`${vehicle.title} - Foto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 672px"
                        priority={idx === 0}
                      />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollPhotos('right')}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover/photos:opacity-100 transition-opacity hover:bg-black/60"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">Sem fotos</div>
            )}

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-black/30" />

            {/* Dots */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
                {vehicle.images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activePhoto ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} 
                  />
                ))}
              </div>
            )}

            {/* Top actions */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10 pointer-events-auto">
              <button
                onClick={handleShare}
                className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-md transition-colors"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-md transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Badges */}
            <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
              <Badge className="bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white font-black text-xs shadow-md">
                {vehicle.brand}
              </Badge>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] space-y-6 text-zinc-800 dark:text-zinc-200">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{vehicle.model}</span>
              <h2 className="font-heading text-xl sm:text-2xl text-zinc-900 dark:text-white uppercase leading-snug tracking-wide">{vehicle.brand} {vehicle.title.replace(`${vehicle.brand} `, '')}</h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="font-heading text-2xl sm:text-3xl text-zinc-900 dark:text-white">
                  Preço sob consulta
                </span>
                <span className="text-xs font-bold text-muted-foreground bg-surface-1 border border-surface px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Direto no WhatsApp
                </span>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-surface-1 border border-surface p-3 rounded-xl flex flex-col justify-center h-[76px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-brand" /> Ano
                </span>
                <span className="text-sm font-bold text-white block">{vehicle.year}</span>
              </div>

              <div className="bg-surface-1 border border-surface p-3 rounded-xl flex flex-col justify-center h-[76px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Gauge className="h-3.5 w-3.5 text-brand" /> Km
                </span>
                <span className="text-sm font-bold text-white block">{formatMileage(vehicle.mileage)}</span>
              </div>

              <div className="bg-surface-1 border border-surface p-3 rounded-xl flex flex-col justify-center h-[76px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Cog className="h-3.5 w-3.5 text-brand" /> Câmbio
                </span>
                <span className="text-[13px] font-bold text-white block leading-tight">{vehicle.transmission || 'Automático'}</span>
              </div>

              <div className="bg-surface-1 border border-surface p-3 rounded-xl flex flex-col justify-center h-[76px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5 mb-1">
                  <Fuel className="h-3.5 w-3.5 text-brand" /> Combustível
                </span>
                <span className="text-[13px] font-bold text-white block leading-tight">{vehicle.fuel || 'Flex'}</span>
              </div>

              {vehicle.plate_end && (
                <div className="bg-surface-1 border border-surface p-3 rounded-xl col-span-2 sm:col-span-1 flex flex-col justify-center h-[76px]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5 mb-1">
                    Placa
                  </span>
                  <span className="text-sm font-bold text-white block font-mono">
                    Final {vehicle.plate_end}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  Opcionais & Equipamentos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-300">
                  {vehicle.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 bg-surface-1 border border-surface/50 px-3 py-2.5 rounded-xl">
                      <Check className="h-4 w-4 text-brand flex-shrink-0" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Sobre este Veículo
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-surface-1 p-4 rounded-xl border border-surface">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Store info */}
            <div className="space-y-3 pt-3 border-t border-surface">
              {store.address && (
                <div className="text-xs text-muted-foreground flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-brand flex-shrink-0" />
                  <span>Disponível para visitação em: <strong className="text-white">{store.address}</strong></span>
                </div>
              )}
              {store.opening_hours && (
                <div className="text-xs text-muted-foreground flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-brand flex-shrink-0" />
                  <span>{store.opening_hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fixed CTA footer */}
          <div className="p-4 sm:p-5 bg-surface-1 border-t border-surface flex items-center justify-between gap-4 flex-shrink-0">
            <div className="hidden sm:block">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block mb-0.5">Interessado?</span>
              <span className="text-sm text-white font-medium">Escolha como prosseguir</span>
            </div>

            <Button
              onClick={() => setStep('interest')}
              className="w-full sm:w-auto flex-1 sm:flex-none px-8 h-12 bg-brand hover:bg-brand/90 text-white rounded-[10px] font-bold text-base gap-2 transition-colors"
            >
              Tenho Interesse
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Interest Options Sheet */}
      {step === 'interest' && (
        <InterestOptionsSheet
          vehicle={vehicle}
          store={storeForModals}
          onClose={() => setStep('detail')}
          onOpenFinancing={(tradeIn) => {
            setHasTradeIn(tradeIn)
            setStep('financing')
          }}
        />
      )}

      {/* Financing Modal */}
      {step === 'financing' && (
        <FinancingModal
          vehicle={vehicle}
          store={storeForModals}
          hasTradeIn={hasTradeIn}
          onClose={onClose}
          onBack={() => setStep('interest')}
        />
      )}
    </>
  )
}