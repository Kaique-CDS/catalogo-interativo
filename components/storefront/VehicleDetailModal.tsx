'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  X, Calendar, Gauge, Fuel, Cog, Check, ShieldCheck, MapPin,
  Share2, ChevronDown, Clock,
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
}

type ModalStep = 'detail' | 'interest' | 'financing'

export default function VehicleDetailModal({ vehicle, store, onClose }: Props) {
  const [step, setStep]           = useState<ModalStep>('detail')
  const [hasTradeIn, setHasTradeIn] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step !== 'detail') setStep('detail')
        else onClose()
      }
    }
    if (vehicle) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [vehicle, onClose, step])

  // Reset step when modal changes vehicle
  useEffect(() => {
    setStep('detail')
    setHasTradeIn(false)
  }, [vehicle?.id])

  if (!vehicle) return null

  const handleShare = async () => {
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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Photo with overlay */}
          <div className="relative aspect-[16/10] sm:aspect-video w-full bg-zinc-900 flex-shrink-0">
            {vehicle.images?.[0] ? (
              <Image
                src={vehicle.images[0]}
                alt={vehicle.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">Sem fotos</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

            {/* Top actions */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
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
              <Badge className="bg-white/95 text-zinc-900 font-black text-xs shadow-md">
                {vehicle.brand}
              </Badge>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-zinc-800">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{vehicle.model}</span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug">{vehicle.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  Preço sob consulta
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Direto no WhatsApp
                </span>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Ano
                </span>
                <span className="text-sm font-bold text-zinc-900 mt-0.5 block truncate">{vehicle.year}</span>
              </div>

              <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> Km
                </span>
                <span className="text-sm font-bold text-zinc-900 mt-0.5 block truncate">{formatMileage(vehicle.mileage)}</span>
              </div>

              <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                  <Cog className="h-3 w-3" /> Câmbio
                </span>
                <span className="text-sm font-bold text-zinc-900 mt-0.5 block truncate">{vehicle.transmission || 'Automático'}</span>
              </div>

              <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                  <Fuel className="h-3 w-3" /> Combustível
                </span>
                <span className="text-sm font-bold text-zinc-900 mt-0.5 block truncate">{vehicle.fuel || 'Flex'}</span>
              </div>

              {vehicle.plate_end && (
                <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    Placa
                  </span>
                  <span className="text-sm font-bold text-zinc-900 mt-0.5 block truncate font-mono">
                    Final {vehicle.plate_end}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Opcionais & Equipamentos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600">
                  {vehicle.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl">
                      <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5">
                  Sobre este Veículo
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-100">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Store info */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              {store.address && (
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <span>Disponível para visitação em: <strong>{store.address}</strong></span>
                </div>
              )}
              {store.opening_hours && (
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <span>{store.opening_hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fixed CTA footer */}
          <div className="p-4 pt-3 pb-8 sm:p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="hidden sm:block">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Interessado?</span>
              <span className="text-xs text-zinc-600 font-medium">Escolha como prosseguir</span>
            </div>

            <Button
              onClick={() => setStep('interest')}
              className="w-full sm:w-auto flex-1 sm:flex-none px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base shadow-md gap-2 active:scale-98 transition-transform"
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