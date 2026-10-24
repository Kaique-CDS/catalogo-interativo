'use client'

import React from 'react'
import Image from 'next/image'
import { Gauge, Car, Fuel, Cog, Eye } from 'lucide-react'
import { formatMileage, formatCurrency } from '@/lib/utils'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props {
  vehicle: Vehicle
  store: Store
  onSelect?: (vehicle: Vehicle) => void
  onInterest?: (vehicle: Vehicle) => void
}

function getOptimizedImageUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    if (!url.includes('f_auto')) {
      return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800/')
    }
  }
  return url
}

export default function VehicleCard({ vehicle, store, onSelect, onInterest }: Props) {
  const rawImage = vehicle.images?.[0]
  const imageUrl = getOptimizedImageUrl(rawImage)
  const mileage = vehicle.mileage ?? 0

  return (
    <div
      onClick={() => onSelect?.(vehicle)}
      className="card-vehicle overflow-hidden flex flex-col h-full rounded-2xl group cursor-pointer border border-surface shadow-xs hover:shadow-md transition-all duration-300"
    >
      {/* ── Imagem 4:3 com zoom suave no hover ── */}
      <div className="relative aspect-[4/3] w-full bg-surface-2 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Overlay hover em desktop */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-zinc-900 text-xs font-bold px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Ver detalhes
          </span>
        </div>
      </div>

      {/* ── Conteúdo do Card ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-3">
          {/* Título (marca + modelo + ano) em destaque com altura reservada para manter cards alinhados */}
          <div>
            <h3 className="font-heading text-heading text-xl sm:text-2xl uppercase leading-tight tracking-wide line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem] flex items-center">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium line-clamp-1">
              {vehicle.title.replace(`${vehicle.brand} `, '').replace(`${vehicle.model} `, '')}
            </p>
          </div>

          {/* Preço do Veículo em destaque (com suporte a De / Por sem quebra de alinhamento) */}
          <div className="flex flex-col justify-end min-h-[50px]">
            {vehicle.old_price && vehicle.old_price > (vehicle.price || 0) && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through font-medium mb-1 block">
                <span className="sr-only">Preço anterior: </span>
                {formatCurrency(vehicle.old_price)}
              </span>
            )}
            {vehicle.price && vehicle.price > 0 ? (
              <span className="font-heading text-price text-2xl sm:text-3xl tracking-tight leading-none">
                <span className="sr-only">Preço atual: </span>
                {formatCurrency(vehicle.price)}
              </span>
            ) : (
              <span className="font-heading text-muted-foreground text-sm uppercase leading-none">
                Preço sob consulta
              </span>
            )}
          </div>

          {/* Chips de especificações legíveis (texto >= 13px) */}
          <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
            <span className="flex items-center gap-1.5 bg-surface-3 text-foreground px-3 py-1.5 rounded-lg border border-surface/50">
              <Gauge className="h-4 w-4 text-brand shrink-0" />
              {formatMileage(mileage)}
            </span>
            {vehicle.fuel && (
              <span className="flex items-center gap-1.5 bg-surface-3 text-foreground px-3 py-1.5 rounded-lg border border-surface/50">
                <Fuel className="h-4 w-4 text-brand shrink-0" />
                {vehicle.fuel}
              </span>
            )}
            {vehicle.transmission && (
              <span className="flex items-center gap-1.5 bg-surface-3 text-foreground px-3 py-1.5 rounded-lg border border-surface/50">
                <Cog className="h-4 w-4 text-brand shrink-0" />
                {vehicle.transmission}
              </span>
            )}
          </div>
        </div>

        {/* Botões — fixados na base com altura confortável (>= 44px) e mesma largura */}
        <div className="mt-auto pt-4 border-t border-surface grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(vehicle)
            }}
            className="btn-card-details h-12 min-h-[48px] rounded-xl border border-surface text-foreground text-xs sm:text-sm font-bold hover:border-brand/40 hover:bg-surface-3 transition-colors flex items-center justify-center text-center"
          >
            Ver Detalhes
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onInterest?.(vehicle)
            }}
            className="btn-brand h-12 min-h-[48px] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center text-center"
          >
            Tenho Interesse
          </button>
        </div>
      </div>
    </div>
  )
}
