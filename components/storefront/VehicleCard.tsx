'use client'

import Image from 'next/image'
import { Gauge, Calendar, Car, Fuel, Cog, Eye } from 'lucide-react'
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

        {/* Selo NOVO / SEMINOVO */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
            {isNew ? 'Novo' : 'Seminovo'}
          </span>
        </div>

        {/* Marca no topo direito */}
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-[4px]">
            {vehicle.brand}
          </span>
        </div>

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Ver detalhes
          </span>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Título em Anton (heading) */}
        <div>
          <h3 className="font-heading text-white text-base sm:text-lg uppercase leading-tight tracking-wide line-clamp-2">
            {vehicle.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{vehicle.model}</p>
        </div>

        {/* Chips de especificações */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium">
          <span className="flex items-center gap-1 bg-surface-3 text-muted-foreground px-2 py-1 rounded-[6px]">
            <Calendar className="h-3 w-3 text-brand flex-shrink-0" />
            {vehicle.year}
          </span>
          <span className="flex items-center gap-1 bg-surface-3 text-muted-foreground px-2 py-1 rounded-[6px]">
            <Gauge className="h-3 w-3 text-brand flex-shrink-0" />
            {formatMileage(mileage)}
          </span>
          {vehicle.transmission && (
            <span className="flex items-center gap-1 bg-surface-3 text-muted-foreground px-2 py-1 rounded-[6px] truncate">
              <Cog className="h-3 w-3 text-brand flex-shrink-0" />
              <span className="truncate">{vehicle.transmission}</span>
            </span>
          )}
          {vehicle.fuel && (
            <span className="flex items-center gap-1 bg-surface-3 text-muted-foreground px-2 py-1 rounded-[6px] truncate">
              <Fuel className="h-3 w-3 text-brand flex-shrink-0" />
              <span className="truncate">{vehicle.fuel}</span>
            </span>
          )}
        </div>

        {/* Laudo + opcionais */}
        <div className="flex flex-col gap-1.5">
          {vehicle.features?.some(f => f.toLowerCase().includes('laudo')) && (
            <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-brand/15 text-brand border border-brand/30">
              ✓ Laudo Cautelar Aprovado
            </span>
          )}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vehicle.features
                .filter(f => !f.toLowerCase().includes('laudo'))
                .slice(0, 3)
                .map(f => (
                  <span key={f} className="text-[10px] bg-surface-3 text-muted-foreground px-2 py-0.5 rounded-[4px] font-medium">
                    {f}
                  </span>
                ))}
              {vehicle.features.filter(f => !f.toLowerCase().includes('laudo')).length > 3 && (
                <span className="text-[10px] text-muted-foreground py-0.5">
                  +{vehicle.features.filter(f => !f.toLowerCase().includes('laudo')).length - 3} mais
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botões — fixados ao fundo */}
        <div className="mt-auto pt-3 border-t border-surface grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect?.(vehicle) }}
            className="h-10 rounded-[10px] border border-surface text-white text-xs font-semibold hover:border-white/30 hover:bg-surface-3 transition-colors"
          >
            Ver Detalhes
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInterest?.(vehicle) }}
            className="btn-brand h-10 text-xs"
          >
            Tenho Interesse
          </button>
        </div>
      </div>
    </div>
  )
}