'use client'

import Image from 'next/image'
import { Gauge, Car, Fuel, Cog, Eye } from 'lucide-react'
import { formatMileage } from '@/lib/utils'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props {
  vehicle: Vehicle
  store: Store
  onSelect?: (vehicle: Vehicle) => void
  onInterest?: (vehicle: Vehicle) => void
}

export default function VehicleCard({ vehicle, store, onSelect, onInterest }: Props) {
  const imageUrl = vehicle.images?.[0]
  const mileage  = vehicle.mileage ?? 0
  const isNew    = mileage < 500

  return (
    <div
      onClick={() => onSelect?.(vehicle)}
      className="card-vehicle overflow-hidden flex flex-col group cursor-pointer"
    >
      {/* ── Imagem 4:3 ── */}
      <div className="relative aspect-[4/3] bg-surface-2 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Ver detalhes
          </span>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="p-4 flex flex-col flex-1 gap-4">

        {/* Título em Anton (heading) */}
        <div>
          <h3 className="font-heading text-white text-lg sm:text-xl uppercase leading-tight tracking-wide line-clamp-2">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium line-clamp-1">
            {vehicle.title.replace(`${vehicle.brand} `, '').replace(`${vehicle.model} `, '')}
          </p>
        </div>

        {/* Chips de especificações: km, combustível, câmbio */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 bg-surface-3 text-white px-2.5 py-1.5 rounded-[6px]">
            <Gauge className="h-3.5 w-3.5 text-brand flex-shrink-0" />
            {formatMileage(mileage)}
          </span>
          {vehicle.fuel && (
            <span className="flex items-center gap-1.5 bg-surface-3 text-white px-2.5 py-1.5 rounded-[6px]">
              <Fuel className="h-3.5 w-3.5 text-brand flex-shrink-0" />
              {vehicle.fuel}
            </span>
          )}
          {vehicle.transmission && (
            <span className="flex items-center gap-1.5 bg-surface-3 text-white px-2.5 py-1.5 rounded-[6px]">
              <Cog className="h-3.5 w-3.5 text-brand flex-shrink-0" />
              {vehicle.transmission}
            </span>
          )}
        </div>

        {/* Botões — fixados ao fundo */}
        <div className="mt-auto pt-4 border-t border-surface grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect?.(vehicle) }}
            className="h-11 rounded-[10px] border border-surface text-white text-xs sm:text-sm font-semibold hover:border-white/30 hover:bg-surface-3 transition-colors"
          >
            Ver Detalhes
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInterest?.(vehicle) }}
            className="btn-brand h-11 text-xs sm:text-sm"
          >
            Tenho Interesse
          </button>
        </div>
      </div>
    </div>
  )
}